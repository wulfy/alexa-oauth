const mysql = require( 'mysql' );
const {DBCONFIG} = require('./constants')
const {databaseLogger} = require('./logger')

let database = null;
class Database {
    constructor( config ) {
        // Connections are acquired lazily and discarded by mysql after a fatal
        // error. Later queries can reconnect without restarting the application.
        this.pool = mysql.createPool({
            ...config,
            connectionLimit: 5,
            waitForConnections: true,
            queueLimit: 50,
            connectTimeout: 5000,
            acquireTimeout: 5000,
        });
        this.pool.on('connection', connection => {
            databaseLogger('connexion works , connected as id ' + connection.threadId);
        });
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            // Do not retry failed statements: a write may already have committed
            // before its connection was lost.
            this.pool.query( sql, args, ( err, rows ) => {
                if ( err )
                    return reject( err );

                resolve( rows );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.pool.end( err => {
                if ( err )
                    return reject( err );
                resolve();
            } );
        } );
    }
}

exports.getDatabase = () => {
    if(database) return database;
    database = new Database(DBCONFIG);
    return database;
};
