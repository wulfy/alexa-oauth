const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { test } = require('node:test');
const mysql = require('mysql');

// Use a disposable database only. The tests terminate their own SQL connections.
assert.ok(process.env.MYSQL_TEST_PORT, 'Set MYSQL_TEST_PORT for a disposable MariaDB');
const testConfig = {
  host: process.env.MYSQL_TEST_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_TEST_PORT),
  user: process.env.MYSQL_TEST_USER || 'root',
  password: process.env.MYSQL_TEST_PASSWORD || 'local-test-only',
  database: process.env.MYSQL_TEST_DATABASE || 'alexa_oauth_test',
};

function query(connection, sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

async function fixture(t, available = true) {
  const sockets = new Set();
  const relay = net.createServer(client => {
    const upstream = net.connect(testConfig.port, testConfig.host);
    for (const socket of [client, upstream]) {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.on('error', () => {
        client.destroy();
        upstream.destroy();
      });
    }
    client.pipe(upstream).pipe(client);
  });
  relay.listen(0, '127.0.0.1');
  await once(relay, 'listening');
  const port = relay.address().port;
  if (!available) await new Promise(resolve => relay.close(resolve));

  const admin = mysql.createConnection(testConfig);
  t.after(() => {
    admin.destroy();
    for (const socket of sockets) socket.destroy();
    if (relay.listening) relay.close();
  });

  // Load the production helper with test-only credentials and a controllable endpoint.
  const constantsPath = require.resolve('../utils/constants');
  const databasePath = require.resolve('../utils/database');
  const constants = require(constantsPath);
  const previousConfig = constants.DBCONFIG;
  constants.DBCONFIG = { ...testConfig, host: '127.0.0.1', port };
  delete require.cache[databasePath];
  const { getDatabase } = require(databasePath);
  const database = getDatabase();
  assert.equal(getDatabase(), database, 'callers share the database helper');
  t.after(async () => {
    constants.DBCONFIG = previousConfig;
    delete require.cache[databasePath];
    await database.close().catch(() => {});
  });

  return {
    database,
    admin,
    async makeAvailable() {
      relay.listen(port, '127.0.0.1');
      await once(relay, 'listening');
    },
  };
}

test('recovers when MariaDB becomes available after application startup', { timeout: 15000 }, async t => {
  const { database, makeAvailable } = await fixture(t, false);
  await assert.rejects(database.query('SELECT 1'));
  await makeAvailable();
  const rows = await database.query('SELECT ? AS value', ['recovered']);
  assert.equal(rows[0].value, 'recovered');
});

test('replaces a connection closed by MariaDB while idle', { timeout: 15000 }, async t => {
  const { database, admin } = await fixture(t);
  const [{ id }] = await database.query('SELECT CONNECTION_ID() AS id');
  await query(admin, 'KILL CONNECTION ?', [id]);
  const [row] = await database.query('SELECT CONNECTION_ID() AS id, 1 AS ok');
  assert.notEqual(row.id, id);
  assert.equal(row.ok, 1);
});

test('rejects an interrupted query without replaying it, then recovers', { timeout: 15000 }, async t => {
  const { database, admin } = await fixture(t);
  const [{ id }] = await database.query('SELECT CONNECTION_ID() AS id');
  const pending = database.query('SELECT SLEEP(3) AS codex_recovery_probe').then(
    rows => ({ rows }),
    error => ({ error }),
  );

  let executing = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    const rows = await query(admin, 'SELECT INFO FROM information_schema.PROCESSLIST WHERE ID = ?', [id]);
    if (rows.some(row => row.INFO && row.INFO.includes('codex_recovery_probe'))) {
      executing = true;
      break;
    }
    await delay(10);
  }
  assert.ok(executing, 'the query must reach MariaDB before disconnecting it');
  await query(admin, 'KILL CONNECTION ?', [id]);
  const result = await pending;
  assert.equal(result.error && result.error.code, 'PROTOCOL_CONNECTION_LOST');
  assert.equal((await database.query('SELECT 1 AS ok'))[0].ok, 1);
});
