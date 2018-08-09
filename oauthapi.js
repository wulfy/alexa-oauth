/**
 * Module dependencies.
 */
var mysql = require('mysql')
var database = require('./database')
const {TOKEN_EXPIRES_DELAY, DBCONFIG} = require('./constants')
console.log(DBCONFIG)
var connectionDatabase = new database(DBCONFIG);
connectionDatabase.connect();

function setExpireDelay(delay) {

      if(delay === null) return null;

     let expires = new Date();
     expires.setSeconds(expires.getSeconds() + delay);
    
    return expires;
}

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
        accessTokenExpiresAt: token.access_token_expires_on,
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
        console.log("user id " + result.user_id);
        console.log("code " + code);
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
  return connectionDatabase.query("UPDATE oauth_codes SET expires='2018-08-08 00:00:00' WHERE code = ?", 
    [code.code])
  .then( results => {
      return true;
    });
};


module.exports.getRefreshToken = function (bearerToken) {
  console.log("getRefreshToken");
  return connectionDatabase.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = ?', 
    [bearerToken])
    .then( results => {
      return results.length ? results[0] : false;
    });
};

/*
 * Get user.
 */

module.exports.getUser = function (username, password) {
  console.log("getUser");
  return connectionDatabase.query('SELECT id FROM users WHERE username = ? AND password = ?', 
    [username, password])
    .then(results => {
      return results.length ? results[0] : false;
    });
};

/**
 * Save token.
 */

module.exports.saveToken = function (token, client, user) {
  console.log("saveAccessToken");
  console.log(token);
  let accessTokenExpiresAt = token.accessTokenExpiresAt;
  accessTokenExpiresAt = setExpireDelay(TOKEN_EXPIRES_DELAY)
  return connectionDatabase.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [
    token.accessToken,
    accessTokenExpiresAt,
    client.clientId,
    token.refreshToken,
    accessTokenExpiresAt,
    user
  ]).then( results => {
      console.log("return save");

      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: accessTokenExpiresAt,
        scope: token.scope,
        client: {id: client.clientId},
        user: {id: user},
        expires_in:TOKEN_EXPIRES_DELAY
      }
  });
};