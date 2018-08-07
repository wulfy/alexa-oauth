/**
 * Module dependencies.
 */

var mysql = require('mysql')

var connection = mysql.createConnection({
  host     : '172.19.0.1',
  user     : 'root',
  password : 'root',
  database : 'test_oauth'
});

/*
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  console.log("access token");
  return connection.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = $1', 
    [bearerToken],
    function (error, results, fields) {

      if (error) throw error;

      var token = result.rows[0];

      return {
        accessToken: token.access_token,
        client: {id: token.client_id},
        expires: token.expires,
        user: {id: token.userId}, // could be any object
      };
    });
};

/**
 * Get client.
 */

module.exports.getClient = function *(clientId, clientSecret) {
  console.log("get client");
  return connection.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = $1 AND client_secret = $2', 
    [clientId, clientSecret],
    function (error, results, fields) {
      if (error) throw error;

      var oAuthClient = result.rows[0];

      if (!oAuthClient) {
        return;
      }

      return {
        clientId: oAuthClient.client_id,
        clientSecret: oAuthClient.client_secret,
        grants: ['password'], // the list of OAuth2 grant types that should be allowed
      };
    });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function *(bearerToken) {
  console.log("getRefreshToken");
  return connection.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = $1', 
    [bearerToken],
    function (error, results, fields) {
      if (error) throw error;
      return result.rowCount ? result.rows[0] : false;
    });
};

/*
 * Get user.
 */

module.exports.getUser = function *(username, password) {
  console.log("getUser");
  return connection.query('SELECT id FROM users WHERE username = $1 AND password = $2', 
    [username, password],
    function (error, results, fields) {
      if (error) throw error;
      return result.rowCount ? result.rows[0] : false;
    });
};

/**
 * Save token.
 */

module.exports.saveAccessToken = function *(token, client, user) {
  console.log("saveAccessToken");
  return connection.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES ($1, $2, $3, $4)', 
    [
    token.accessToken,
    token.accessTokenExpiresOn,
    client.id,
    token.refreshToken,
    token.refreshTokenExpiresOn,
    user.id
  ],function (error, results, fields) {
      if (error) throw error;
    return result.rowCount ? result.rows[0] : false; // TODO return object with client: {id: clientId} and user: {id: userId} defined
  });
};