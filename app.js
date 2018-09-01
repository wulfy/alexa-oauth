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
var compression = require('compression');
var helmet = require('helmet');

const authenticate = require('./authenticate')
const {checkDomoticz} = require('./utils/domoticz')
const {encodeTokenFor,cryptPassword,encrypt,decrypt,generateAuthCode} = require('./utils/security');
const {ALEXA_TOKEN_FORMAT,COOKIE_SECRET,TOKEN_EXPIRES_DELAY,NOT_CHANGED_PASSWORD} = require('./utils/constants')
const {saveAuthorizationCode} = require("./oauthapi")
const {
        checkExistsEmail,
        createAccount,
        getUserAccount,
        getUserData,
        updateUserData,
        createData,
        updateUser,
        getPassCode,
        saveLostPassCode,
        getUserByMail,
        revokeLostPasswordCode
      } = require("./utils/accountManagement")

const Request = oAuth2Server.Request;
const Response = oAuth2Server.Response;
const INIT_MESSAGE = {message:{success:null,error:null}};
const {setExpireDelay} = require('./utils/date.js')
const {sendEmail} = require('./utils/mail.js')
const {debugLogger, prodLogger} = require('./utils/logger.js')

// Create an Express application.
var app = express();

app.use(helmet());
app.use(compression()); //Compress all routes
//app.use(express.static(path.join(__dirname, 'views/images')));
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
    const options = {accessTokenLifetime:TOKEN_EXPIRES_DELAY};
    prodLoger('/oauth/token');
    app.oauth
      .token(request,response,options)
      .then(function(token) {
        // Todo: remove unnecessary values in response
        debugLoger('-------sending token to format' + ALEXA_TOKEN_FORMAT);
        debugLoger(encodeTokenFor(token,ALEXA_TOKEN_FORMAT));
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
        prodLoger("ERROR ");
        prodLogger(err)
        return res.status( 500).json(err)
      })
  });

// Post login.
app.post('/login', async function(req, res) {
  // @TODO: Insert your own login mechanism.
  //const code = "admin";
  // Successful logins should send the user back to /oauth/authorize.
  prodLogger("post login");
  const login = req.body.email;
  const password = req.body.password;

  const user = await getUserAccount(login,password);
  const redirect_uri = req.body.redirect_uri;
  const state = req.body.state;
  var request = new Request(req);
  var response = new Response(res);
  //const options = {accessTokenLifetime:172800}

  if(!user){
    const error  = "Bad credentials";
    prodLogger("error")
    return res.redirect(util.format('%s?error=%s&redirect_uri=%s&state=%s','/login',error,redirect_uri,state));
  }

  if(redirect_uri && state )
  {
      var path = redirect_uri || '/home';
      debugLogger(req.body);

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
      debugLogger("redirect to : " + util.format('%s?state=%s&code=%s', path, state, code.authorizationCode));
      
      /*return app.oauth.authorize(request, response,options).then(function(success) {
                res.json(success)
            }).catch(function(err){
              res.status(err.code || 500).json(err)
            })*/
      return res.redirect(util.format('%s?state=%s&code=%s', path, state, code.authorizationCode));
  }else{
      req.session = {uid:user.id,...INIT_MESSAGE};
      prodLogger("redirecting");
      return res.redirect("./account");
  }
});


app.get('/logout', function(req, res) {
    req.session = null;
    return res.redirect("./login");
  });

app.get('/login', function(req, res) {
  prodLogger("get login");
  const error  = req.query.error || null;
  const success  = req.query.success || null;
  if(req.session.uid)
    return res.redirect("/account");
  else
    return res.render('login',{error,success,client_id:req.query.client_id,redirect_uri:req.query.redirect_uri,state:req.query.state});
});


app.post('/lostPass', async function(req, res) {
  const code = req.body.code;
  const newPass = req.body.userPassword;
  const userData = await getPassCode(code);
  let error = null;
  let success = null;
  if(userData)
  {
    await updateUser(userData.id,userData.email,newPass)
    await revokeLostPasswordCode(code)
    success = "Email reset";
  }else
  {
    error = "Retrieve code is invalid";
  }
  
  
  return res.redirect(util.format('./login?error=%s&success=%s',error,success));
});

app.get('/lostPass', async function(req, res) {
  const code = req.query.code;
  const userData = await getPassCode(code);
  let error = "";
  let success = "";

  if(typeof userData === "object")
    return res.render('lostPass',{email:userData.email,code});

  error = "Retrieve code is invalid";
    
  return res.redirect(util.format('./login?error=%s&success=%s',error,success));
});

app.get('/recoverPass', function(req, res) {
    const success = req.query.success;
    return res.render('recoverpass',{success});
});

app.post('/recoverPass', async function(req, res) {
  const email = req.body.userMail;
  prodLogger("reset email " + email);
  const user = await getUserByMail(email);
  if(user)
  {
      const code = generateAuthCode();
      const expires = setExpireDelay(600);
      await saveLostPassCode(user,code,expires);
      sendEmail(user.email,code);
  }

  return res.redirect(util.format('./recoverPass?success=%s', "Email sent"));
});

app.get('/register', function(req, res) {
  prodLogger("get register");
  debugLogger(req.query.error)
  const error  = req.query.error || null;
  return res.render('register',{error});
});

app.post('/register', async function(req, res) {
  prodLogger("post register");
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
  {prodLogger("exists");
    prodLogger(emailExists)
    error = "Email already exists";
    return res.redirect(util.format('/register?error=%s', error));
  }
  prodLogger("creating account")
  try {
    await createAccount(email, password);
    const user = await getUserAccount(email,password);
    prodLogger("creating data ");
    debugLogger(user.id)//TODO : understand why NULL
    const user_data = await createData(user.id);
    //create session 
    req.session = {uid:user.id,...INIT_MESSAGE};

    return res.redirect("./account");
  }catch(e)
  {
    throw e;
  }
  
});


app.post('/authorise', function(req, res){
  prodLogger('/authorise');
    var request = new Request(req);
    var response = new Response(res);
    let authenticateHandler = {
      handle: function(request, response) {
        return {id:1,email:"ludo@ludo.com"}/* get authenticated user */;
      }
    };
    const options = {authenticateHandler:authenticateHandler,accessTokenLifetime:172800};

    return app.oauth.authorize(request, response, options).then(function(success) {
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

function getMessage(req) {
  debugLogger(req.session);
  let data = {success:null,error:null};
  if(req.session && req.session.message)
  {
    data = req.session.message;
    req.session = {...req.session,...INIT_MESSAGE} ;
  }
  debugLogger(req.session);
  return data;
}

app.get('/account', async function(req,res){
  
  const message = getMessage(req);
  if(!checkSession(req)){
      prodLogger("no session")
      res.redirect(util.format("./login?error=%s","You are not connected, please connect"));
  }
  else
  {
    let success = message.success || "";
    let error = message.error || "";
    debugLogger(" UID " + req.session.uid)
    let domoticzCon = false;
    let user = await getUserData(req.session.uid)
    user.password = NOT_CHANGED_PASSWORD;
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
      prodLogger("no session")
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
          const userEmail = req.body.userMail;
          let userPassword = "";

          if(user.domoticzPassword === req.body.domoPass)
            domoticzPassword = user.domoticzPassword;
          else
            {
              prodLogger("encrypt")
              domoticzPassword = encrypt(req.body.domoPass);
            }

          if(req.body.userPassword === NOT_CHANGED_PASSWORD)
          {
            userPassword = user.password;
          }else{
            userPassword = encrypt(req.body.userPassword);
          }

          await updateUserData(req.session.uid,domoticzHost,domoticzPort,domoticzlogin,domoticzPassword)
          await updateUser(req.session.uid,userEmail,userPassword)
          req.session.message.success ="Changes saved";
          res.redirect("./account");
    }catch(e) {
          req.session.message.error = "Changes saved";
          res.redirect("./account");
      }
  }
});

app.get('/profile', authenticate(app.oauth,{scope:'profile'}), function(req,res){
  res.json({
    profile: req.user
  })
});


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/images/index.html'));
})
app.get('/logo', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/images/alhau_large_logo.png'));
})
app.get('/favicon.png', function (req, res) {
  res.sendFile(path.join(__dirname+'/views/images/alhau_icon.png'));
})


module.exports = app;