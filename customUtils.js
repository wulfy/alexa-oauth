const {ALEXA_TOKEN_FORMAT, DEFAULT_TOKEN_FORMAT} = require('./constants')

module.exports = function encodeTokenFor(token,format){
	let formatedToken = token;

	switch(format){
		case ALEXA_TOKEN_FORMAT:
			formatedToken = {
				...formatedToken,
				access_token : formatedToken.accessToken,
				"token_type":"Bearer"
			}
			break;
		default:
	}

	return formatedToken;
}