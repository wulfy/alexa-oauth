const {ALEXA_TOKEN_FORMAT, DEFAULT_TOKEN_FORMAT} = require('./constants')

module.exports = function encodeTokenFor(token,format){
	let formatedToken = token;

	switch(format){
		case ALEXA_TOKEN_FORMAT:
			formatedToken = {
				access_token : token.accessToken,
				token_type:"Bearer",
				expires_in:token.expires_in,
				refresh_token:token.refreshToken,
				scope:"NOSCOPE"
			}
			break;
		default:
	}

	return formatedToken;
}