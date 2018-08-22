require('dotenv').config()

exports.DBCONFIG = {
  host     : process.env.MYSQL_ADDON_HOST,
  user     : process.env.MYSQL_ADDON_USER,
  password : process.env.MYSQL_ADDON_PASSWORD,
  port     : process.env.MYSQL_ADDON_PORT,
  database : process.env.MYSQL_ADDON_DB
};

exports.PRIVATEKEY = process.env.PRIVATEKEY;
exports.PUBLICKEY = process.env.PUBLICKEY;

exports.TOKEN_EXPIRES_DELAY = 86400;

exports.ALEXA_TOKEN_FORMAT = "alexa";
exports.DEFAULT_TOKEN_FORMAT = "default";

exports.CRYPTOPASS = process.env.CRYPTOPASS;
exports.CODE_KEY = process.env.CODE_KEY;
exports.COOKIE_SECRET = process.env.COOKIE_SECRET;

