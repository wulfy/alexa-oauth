/**
 * Module dependencies.
 */

const bodyParser = require('body-parser');
const express = require('express');
const oAuth2Server = require('oauth2-server');
const render = require('co-views')('views');
const util = require('util');
const cookieSession = require('cookie-session')
const path = require('path');

const authenticate = require('./authenticate')
const {checkDomoticz} = require('./utils/domoticz')
const {encodeTokenFor,cryptPassword,encrypt,decrypt,generateAuthCode} = require('./utils/security');
const {ALEXA_TOKEN_FORMAT,COOKIE_SECRET} = require('./utils/constants')
const {saveAuthorizationCode} = require("./oauthapi")
const {
        checkExistsEmail,
        createAccount,
        getUserAccount,
        getUserData,
        updateUserData,
        createData
      } = require("./utils/accountManagement")

const Request = oAuth2Server.Request;
const Response = oAuth2Server.Response;

// Create an Express application.
var app = express();
app.set('trust proxy', 1) // trust first proxy
app.use(cookieSession({
  name: 'alexaloauth_session',
  secret: COOKIE_SECRET,
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// Add body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'pug');
app.set('views', './views')

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
        console.log('-------sending token to format' + ALEXA_TOKEN_FORMAT);
        console.log(encodeTokenFor(token,ALEXA_TOKEN_FORMAT));
        res.removeHeader('Content-Length');
        res.removeHeader('ETag');
        res.removeHeader('Date');
        res.removeHeader('X-Powered-By');
        res.removeHeader('Connection');
          res.set({
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
          });
        return res.json(encodeTokenFor(token,ALEXA_TOKEN_FORMAT))
      }).catch(function(err){
        return res.status( 500).json(err)
      })
  });

// Post login.
app.post('/login', async function(req, res) {
  // @TODO: Insert your own login mechanism.
  //const code = "admin";
  // Successful logins should send the user back to /oauth/authorize.
  const login = req.body.email;
  const password = req.body.password;
  const user = await getUserAccount(login,password);
  const redirect_uri = req.body.redirect_uri;
  const state = req.body.state;

  if(!user){
    const error  = "Bad credentials";
    console.log("error")
    return res.redirect(util.format('%s?error=%s&redirect_uri=%s&state=%s','/login',error,redirect_uri,state));
  }

  if(redirect_uri && state )
  {
      var path = redirect_uri || '/home';
      console.log("post login");
      console.log(req.body);
      //generate authorization code
      const authorizationCode = generateAuthCode();
      const code = {
        expiresAt:null,
        redirectUri:null,
        authorizationCode:authorizationCode,
        scope:"ALL"
       };
       const client = {id:req.body.client_id};
      saveAuthorizationCode(code, client, user);
      console.log("redirect to : " + util.format('%s?state=%s&code=%s', path, state, code.authorizationCode));
      return res.redirect(util.format('%s?state=%s&code=%s', path, state, code.authorizationCode));
  }else{
      req.session = {uid:user.id};
      console.log("redirecting");
      return res.redirect("./account");
  }
});

app.get('/login', function(req, res) {
  console.log("get login");
  const error  = req.query.error || null;
  if(req.session.uid)
    return res.redirect("/account");
  else
    return res.render('login',{error,client_id:req.query.client_id,redirect_uri:req.query.redirect_uri,state:req.query.state});
});

app.get('/register', function(req, res) {
  console.log("get register");
  console.log(req.query.error)
  const error  = req.query.error || null;
  return res.render('register',{error});
});

app.post('/register', async function(req, res) {
  console.log("post register");
  const email = req.body.email;
  const password = req.body.password;
  let error = "";
  if( ! email || !password )
  {
    error = "Email and Password are mandatory";
    return res.redirect(util.format('/register?error=%s', error));
  }
  emailExists = await checkExistsEmail(email);
  if(emailExists)
  {console.log("exists");
    console.log(emailExists)
    error = "Email already exists";
    return res.redirect(util.format('/register?error=%s', error));
  }
  console.log("creating account")
  try {
    await createAccount(email, password);
    const user = await getUserAccount(email,password);
    console.log("creating data ");
    console.log(user.id)//TODO : understand why NULL
    const user_data = await createData(user.id);
    //create session 
    req.session = {uid:user.id};

    return res.redirect("./account");
  }catch(e)
  {
    throw e;
  }
  
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

function checkSession(req) {
  return req.session.uid ;
}

app.get('/account', async function(req,res){
  
  if(!checkSession(req)){
      console.log("no session")
      res.redirect(util.format("./login?error=%s","You are not connected, please connect"));
  }
  else
  {
    let success = req.query.success || "";
    let error = req.query.error || "";
    console.log(" UID " + req.session.uid)
    let domoticzCon = false;
    let user = await getUserData(req.session.uid)
    try{
      domoticzCon = await checkDomoticz(user);
      domoticzCon ? success += "- Domoticz connection is OK - ": error+="- Domoticz connection is NOK -";
    }catch(e){
      error+=" Domoticz connection is NOK "
    }
    res.render('account',{...user,success,error});
  }
});

app.post('/account', async function(req,res){
  
  if(!checkSession(req)){
      console.log("no session")
      res.redirect("./login");
  }
  else
  {
    try {
          let domoticzPassword = "";
          const user = await getUserData(req.session.uid)
          const domoticzHost = req.body.domoHost;
          const domoticzPort = req.body.domoPort;
          const domoticzlogin = req.body.domoLogin;

          if(user.domoticzPassword === req.body.domoPass)
            domoticzPassword = user.domoticzPassword;
          else
            {
              console.log("encrypt")
              domoticzPassword = encrypt(req.body.domoPass);
            }

          const data = await updateUserData(req.session.uid,domoticzHost,domoticzPort,domoticzlogin,domoticzPassword)
          res.redirect(util.format("./account?success=%s","Changes saved"));
    }catch(e) {
          res.redirect(util.format("./account?error=%",e.message));
      }
  }
});

app.get('/profile', authenticate(app.oauth,{scope:'profile'}), function(req,res){
  res.json({
    profile: req.user
  })
});


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/index.html'));
})
app.get('/logo', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/alhau_large_logo.png'));
})
app.get('/favicon.png', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/alhau_icon.png'));
})


module.exports = app;