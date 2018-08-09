require('dotenv').config()

exports.DBCONFIG = {
  host     : process.env.MYSQL_ADDON_HOST,
  user     : process.env.MYSQL_ADDON_USER,
  password : process.env.MYSQL_ADDON_PASSWORD,
  port     : process.env.MYSQL_ADDON_PORT,
  database : process.env.MYSQL_ADDON_DB
};

exports.TOKEN_EXPIRES_DELAY = 86400;

const ALEXA_TOKEN_FORMAT = "alexa";
const DEFAULT_TOKEN_FORMAT = "default";

exports.ENCODE_FORMATS_DEFAULT = [DEFAULT_TOKEN_FORMAT,ALEXA_TOKEN_FORMAT];
exports.ALEXA_TOKEN_FORMAT;
exports.DEFAULT_TOKEN_FORMAT;

