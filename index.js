/**
 * Module dependencies.
 */

var bodyParser = require('body-parser');
var express = require('express');
var OAuth2Server = require('express-oauth-server');
var render = require('co-views')('views');
var util = require('util');

// Create an Express application.
var app = express();
var options = { 
  useErrorHandler: true, 
  continueMiddleware: true,
}

// Add body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add OAuth server.
app.oauth =  new OAuth2Server({
  model: require('./oauthapi.js'),
  grants: ['password'],
  debug: true,
  useErrorHandler: true, 
  continueMiddleware: true,
});
//app.use(app.oauth.errorHandler());

// Post token.
app.post('/oauth/token', app.oauth.token());

// Get authorization.
app.get('/oauth/authorize', function(req, res) {
  console.log("get authorize");
  // Redirect anonymous users to login page.
  if (!req.app.locals.user) {
    return res.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri));
  }
  console.log("OK authorize");
    app.oauth.authorize()
  return render('authorize', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

// Post authorization.
app.post('/oauth/authorize', function(req, res) {
  console.log("authorize");
  // Redirect anonymous users to login page.
  if (!req.app.locals.user) {
    return res.redirect(util.format('/login?client_id=%s&redirect_uri=%s', req.query.client_id, req.query.redirect_uri));
  }
  console.log("authorize ok " + req.app.locals.user);
  app.oauth.authorise();
  //return app.oauth.authorise();
});

// Get login.
app.get('/login', function(req,res) {
  console.log("login!");
  return render('login', {
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
  });
});

// Post login.
app.post('/login', function(req, res) {
   console.log("post login");
  // @TODO: Insert your own login mechanism.
  if (req.body.email === 'thom@nightworld.com') {
    return render('login', {
      redirect: req.body.redirect,
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri
    });
  }
  req.app.locals.user = "test";
  // Successful logins should send the user back to /oauth/authorize.
  var path = req.body.redirect || '/login';
  console.log("redirect " + path);
  //return app.oauth.authorize();
  return res.redirect(util.format('/%s?client_id=%s&redirect_uri=%s', path, req.query.client_id, req.query.redirect_uri));
});

// Get secret.
app.get('/secret', app.oauth.authenticate(), function(req, res) {
  // Will require a valid access_token.
  res.send('Secret area');
});

app.get('/public', function(req, res) {
  // Does not require an access_token.
  res.send('Public area');
});

app.get('/', function (req, res) {
  res.send('Hello World!')
})


// Start listening for requests.
app.listen(4400,function () {
  console.log(' app listening on port 4400!')
});