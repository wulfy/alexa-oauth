/**
 * Module dependencies.
 */

var mysql = require('mysql')

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'test_oauth'
});

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
  return connection.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = ?', 
    [bearerToken],
    function (error, results, fields) {

      if (error) throw error;

      var token = results[0];

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
  console.log("get client "+ clientId + " " + clientSecret);
  return connection.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ? AND client_secret = ?', 
    [clientId, clientSecret],
    function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      
      var oAuthClient = results[0];

      if (!oAuthClient) {
        console.log("NO OAUTH");
        return;
      }

      const returnData = {
        "clientId": oAuthClient.client_id,
        "clientSecret": oAuthClient.client_secret,
        "grants": [
                  "password",
                  "authorization_code",
                  "refresh_token"
              ] // the list of OAuth2 grant types that should be allowed
      };

      console.log(returnData)
      return returnData;
    });
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function *(bearerToken) {
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

module.exports.getUser = function *(username, password) {
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

module.exports.saveAccessToken = function *(token, client, user) {
  console.log("saveAccessToken");
  return connection.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES (?, ?, ?, ?)', 
    [
    token.accessToken,
    token.accessTokenExpiresOn,
    client.id,
    token.refreshToken,
    token.refreshTokenExpiresOn,
    user.id
  ],function (error, results, fields) {
      if (error) throw error;
    return results.length ? results[0] : false; // TODO return object with client: {id: clientId} and user: {id: userId} defined
  });
};