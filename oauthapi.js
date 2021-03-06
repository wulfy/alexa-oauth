/***** API TO MANAGE OAUTH PROCESS
      ONLY 2 actions are done in the app (login and oauth/token)
      and only one action is called : oauth.token(xxxx) which will generate a token

      TODO:
      - support refresh token (today it's impossible to regenerate a token)
      - 
      ****/


/**
 * Module dependencies.
 */
const {getDatabase} = require('./utils/database')
const {TOKEN_EXPIRES_DELAY} = require('./utils/constants')
const {setExpireDelay} = require('./utils/date.js')
const {oauthLogger, debugLogger} = require('./utils/logger.js')
connectionDatabase = getDatabase();

/*
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  debugLogger("access token");
  return connectionDatabase.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = ?', 
    [bearerToken])
    .then(results => {

      var token = results[0];
      debugLogger(token);
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

//Alexa presente ici son client ID et client SECRET
module.exports.getClient = function (clientId, clientSecret) {
  debugLogger("get client "+ clientId + " " + clientSecret);
  return connectionDatabase.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ? AND client_secret = ?', 
    [clientId, clientSecret]).then( results => {
        var oAuthClient = results[0];
        debugLogger("return client");
        if(!oAuthClient) return false;
        debugLogger("data");
        return {
          "clientId": oAuthClient.client_id,
          "id": oAuthClient.client_id,
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

//save authorization code in database (the code has a timeout delay before expiring)
module.exports.saveAuthorizationCode = function (code, client, user) {
  oauthLogger("saveAuthorizationCode");
  oauthLogger(client);
  oauthLogger(user);
  return connectionDatabase.query('INSERT INTO  oauth_codes(expires, redirect_uri, client_id, user_id, code, scope) VALUES (?, ?, ?, ?, ?, ?)', 
    [
     code.expiresAt || setExpireDelay(600),
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
  oauthLogger("getAuthorizationCode");

  return connectionDatabase.query('SELECT expires, redirect_uri, client_id, user_id, scope FROM oauth_codes WHERE code = ?', 
    [code]).then( results => {
        if(!results.length) return false;
        let result = results[0];
        oauthLogger("user id " + result.user_id);
        oauthLogger("code " + code);
        const authCode = {
          code: code,
          client: {id:result.client_id},
          expiresAt: result.expires,
          redirectUri: result.redirect_uri,
          user: {id:result.user_id},
          scope: result.scope,
        };
        oauthLogger(authCode)
        return authCode;
      }
    );
};


// revoke code when used (date is set in the past to invalidate it)
module.exports.revokeAuthorizationCode = function (code) {
  oauthLogger("revokeAuthorizationCode " + code.code);
  return connectionDatabase.query("UPDATE oauth_codes SET expires='2018-08-08 00:00:00' WHERE code = ?", 
    [code.code])
  .then( results => {
      return true;
    });
};

//not working for now
module.exports.getRefreshToken = function (bearerToken) {
  oauthLogger("getRefreshToken " + bearerToken);
  return connectionDatabase.query('SELECT * FROM oauth_tokens INNER JOIN users on users.id = oauth_tokens.user_id INNER JOIN oauth_clients on oauth_clients.client_id = oauth_tokens.client_id WHERE refresh_token = ?', 
    [bearerToken])
    .then( results => {
      oauthLogger(results[0]);
      if(results.length <1)
          return false;

      const data = results[0];
      const returnValue ={
          refreshToken: data.refresh_token,
          refreshTokenExpiresAt:data.refresh_token_expires_on,
          client: {id:data.client_id}, // with 'id' property
          user: {id:data.user_id,email:data.email}
        }

      oauthLogger(returnValue);
      return returnValue;
    });
};

/*
 * Get user.with encrypted pass
 */

module.exports.getUser = function (username, password) {
  oauthLogger("getUser");
  return connectionDatabase.query('SELECT id FROM users WHERE username = ? AND password = ?', 
    [username, password])
    .then(results => {
      return results.length ? results[0] : false;
    });
};

// revoke code when used (date is set in the past to invalidate it)
module.exports.revokeToken = function (token) {
  oauthLogger("revokeToken ");
  oauthLogger(token);
  return connectionDatabase.query("UPDATE oauth_tokens SET refresh_token_expires_on='2018-08-08 00:00:00' WHERE refresh_token = ?", 
    [token.refreshToken])
  .then( results => {
      return true;
    });
    return true;
};

/**
 * Save token.
 */

module.exports.saveToken = function (token, client, user) {
  oauthLogger("saveAccessToken");
  oauthLogger(token);
  oauthLogger(user);
  const accessTokenExpiresAt = token.accessTokenExpiresAt;
  const refreshTokenExpiresAt = token.refreshTokenExpiresAt;

  return connectionDatabase.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [
    token.accessToken,
    accessTokenExpiresAt,
    client.clientId,
    token.refreshToken,
    refreshTokenExpiresAt,
    user.id
  ]).then( results => {
      oauthLogger("return save");

      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt,
        scope: token.scope,
        client: {id: client.clientId},
        user: {id: user},
        expires_in:TOKEN_EXPIRES_DELAY
      }
  });
};