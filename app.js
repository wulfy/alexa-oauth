/**
 * Module dependencies.
 */

var bodyParser = require('body-parser');
var express = require('express');
var oAuth2Server = require('oauth2-server');
var render = require('co-views')('views');
var util = require('util');
var authenticate = require('./authenticate')
var path = require('path');
var Request = oAuth2Server.Request;
var Response = oAuth2Server.Response;

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
app.oauth =  new oAuth2Server({
  model: require('./oauthapi.js'),
});
//app.use(app.oauth.errorHandler());

// Post token.
app.post('/oauth/token', function(req,res,next){
    var request = new Request(req);
    var response = new Response(res);
    console.log('/oauth/token');
    app.oauth
      .token(request,response)
      .then(function(token) {
        // Todo: remove unnecessary values in response
        console.log('sending token');
        return res.json(token)
      }).catch(function(err){
        return res.status( 500).json(err)
      })
  });

// Post login.
app.post('/login', function(req, res) {
  // @TODO: Insert your own login mechanism.
  const code = "admin";
  // Successful logins should send the user back to /oauth/authorize.
  var path = req.body.redirect_uri || 'https://alexa.amazon.co.jp/api/skill/link/M2AW7QW3AUH9E';
  console.log("redirect to : " + util.format('%s?code=%s&client_id=%s&redirect_uri=%s', path, code, req.query.client_id, req.query.redirect_uri));
  return res.redirect(util.format('%s?code=%s', path, code));
});

app.get('/login', function(req, res) {
  console.log(req)
  return res.sendFile(path.join(__dirname + '/login.html'));
});


app.post('/authorise', function(req, res){
  console.log('/authorise');
    var request = new Request(req);
    var response = new Response(res);

    return app.oauth.authorize(request, response).then(function(success) {
        res.json(success)
    }).catch(function(err){
      res.status(err.code || 500).json(err)
    })
  });

app.get('/secure', authenticate(app.oauth), function(req,res){
  res.json({message: 'Secure data'})
});

app.get('/me', authenticate(app.oauth), function(req,res){
  res.json({
    me: req.user,
    messsage: 'Authorization success, Without Scopes, Try accessing /profile with `profile` scope',
    description: 'Try postman https://www.getpostman.com/collections/37afd82600127fbeef28',
    more: 'pass `profile` scope while Authorize'
  })
});

app.get('/profile', authenticate(app.oauth,{scope:'profile'}), function(req,res){
  res.json({
    profile: req.user
  })
});


app.get('/', function (req, res) {
  res.send('Hello World!')
})


module.exports = app;