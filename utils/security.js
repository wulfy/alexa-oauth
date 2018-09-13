const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {ALEXA_TOKEN_FORMAT, DEFAULT_TOKEN_FORMAT, CRYPTOPASS, CODE_KEY} = require('./constants')

const saltRounds = 10;

exports.encodeTokenFor = (token,format) =>{
	let formatedToken = token;

	switch(format){
		case ALEXA_TOKEN_FORMAT:
			formatedToken = {
				access_token : token.accessToken,
				token_type:"bearer",
				expires_in:token.expires_in,
				refresh_token:token.refreshToken
			};
			break;
		default:
	}

	return formatedToken;
}

function cryptPassword (password) {
   return bcrypt.hashSync(password, saltRounds);
};

exports.comparePassword = function(plainPass,hash) {
   return bcrypt.compareSync(plainPass, hash);
};

exports.encrypt = (data) => {
	const toSave = JSON.stringify(data);
	const cipher = crypto.createCipher('aes192', CRYPTOPASS);
	let encrypted = cipher.update(toSave, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	return encrypted;
}

exports.decrypt = (encryptedData) => {
	const decipher = crypto.createDecipher('aes192', CRYPTOPASS);
	let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return JSON.parse(decrypted);
}

exports.cryptPassword = cryptPassword;
exports.generateAuthCode = () => cryptPassword(CODE_KEY+new Date().getTime());