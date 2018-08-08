/**
 * Module dependencies.
 */
require('dotenv').config()

var mysql = require('mysql')
var database = require('./database')
const dbConfig = {
  host     : process.env.MYSQL_ADDON_HOST,
  user     : process.env.MYSQL_ADDON_USER,
  password : process.env.MYSQL_ADDON_PASSWORD,
  port     : process.env.MYSQL_ADDON_PORT,
  database : process.env.MYSQL_ADDON_DB
};

var connection = mysql.createConnection(dbConfig);

var connectionDatabase = new database(dbConfig);

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});

/*
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  console.log("access token");
  return connectionDatabase.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = ?', 
    [bearerToken])
    .then(results => {

      var token = results[0];
      console.log(token);
      if(!token) return false;
      return {
        accessToken: token.access_token,
        client: {id: token.client_id},
        accessTokenExpiresAt: new Date(token.expires),
        user: {id: token.userId}, // could be any object
      };
    });
};

/**
 * Get client.
 */

module.exports.getClient = function (clientId, clientSecret) {
  console.log("get client "+ clientId + " " + clientSecret);

  return connectionDatabase.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ? AND client_secret = ?', 
    [clientId, clientSecret]).then( results => {
        var oAuthClient = results[0];
        console.log("return client");
        if(!oAuthClient) return false;
        console.log("data");
        return {
          "clientId": oAuthClient.client_id,
          "clientSecret": oAuthClient.client_secret,
          "grants": [
                    "password",
                    "authorization_code",
                    "refresh_token"
                ] // the list of OAuth2 grant types that should be allowed
        };
      }
    );
};


module.exports.saveAuthorizationCode = function (code, client, user) {
  console.log("saveAuthorizationCode");
  console.log(client);
  console.log(user);
  return connectionDatabase.query('INSERT INTO  oauth_codes(expires, redirect_uri, client_id, user_id, code, scope) VALUES (?, ?, ?, ?, ?, ?)', 
    [
     code.expiresAt,
     code.redirectUri,
     client.id,
     user.id,
     code.authorizationCode,
     code.scope
     ]).then( results => {
        
        return {
          ...code,
          ...user,
          ...client
        };
      }
    );
}; 

/**
 * Get refresh token.
 */

module.exports.getAuthorizationCode = function (code) {
  console.log("getAuthorizationCode");

  return connectionDatabase.query('SELECT expires, redirect_uri, client_id, user_id, scope FROM oauth_codes WHERE code = ?', 
    [code]).then( results => {
        if(!results.length) return false;
        let result = results[0];
        console.log(result.user_id);
        return {
          code: code,
          client: result.client_id,
          expiresAt: new Date(result.expires),
          redirectUri: result.redirect_uri,
          user: result.user_id,
          scope: result.scope,
        };
      }
    );
};

module.exports.revokeAuthorizationCode = function (code) {
  console.log("revokeAuthorizationCode " + code.code);
  return connection.query("UPDATE oauth_codes SET expires='2018-08-08 00:00:00' WHERE code = ?", 
    [code.code],
    function (error, results ) {
      if (error) throw error;
      if(!results.length) return false;
      return {
        code: code,
      }
    });
};


module.exports.getRefreshToken = function (bearerToken) {
  console.log("getRefreshToken");
  return connection.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = ?', 
    [bearerToken],
    function (error, results, fields) {
      if (error) throw error;
      return results.length ? results[0] : false;
    });
};

/*
 * Get user.
 */

module.exports.getUser = function (username, password) {
  console.log("getUser");
  return connection.query('SELECT id FROM users WHERE username = ? AND password = ?', 
    [username, password],
    function (error, results, fields) {
      if (error) throw error;
      return results.length ? results[0] : false;
    });
};

/**
 * Save token.
 */

module.exports.saveToken = function (token, client, user) {
  console.log("saveAccessToken");
  console.log(user);
  return connectionDatabase.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [
    token.accessToken,
    token.accessTokenExpiresAt,
    client.clientId,
    token.refreshToken,
    token.accessTokenExpiresAt,
    user
  ]).then( results => {
      console.log("return save");

      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        client: {id: client.clientId},
        user: {id: user}
      }
  });
};