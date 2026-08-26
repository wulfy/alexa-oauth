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

/**
 * Encryption of Domoticz credentials.
 *
 * Historically these were stored with the (now removed) crypto.createCipher('aes192', CRYPTOPASS),
 * which derives key+iv from the passphrase through OpenSSL's EVP_BytesToKey (single MD5 pass, no
 * salt, no IV, no authentication) and produces deterministic ciphertext.
 *
 * New values are written with AES-256-GCM: a random IV per record and an authentication tag,
 * prefixed with "v2:". Old values remain readable (legacyDecrypt) so nothing already stored
 * becomes unreadable; callers can re-encrypt them transparently on read.
 */

const V2_PREFIX = 'v2:';
const V2_SALT = 'alhau-domoticz-credentials-v2';

let _v2Key = null;
function v2Key(){
	if(!_v2Key) _v2Key = crypto.scryptSync(String(CRYPTOPASS), V2_SALT, 32);
	return _v2Key;
}

// OpenSSL EVP_BytesToKey with MD5, no salt, iteration count 1 — matches the legacy createCipher('aes192').
function evpBytesToKey(passphrase, keyLen, ivLen){
	let derived = Buffer.alloc(0);
	let block = Buffer.alloc(0);
	const pass = Buffer.from(String(passphrase), 'utf8');
	while(derived.length < keyLen + ivLen){
		const hash = crypto.createHash('md5');
		hash.update(Buffer.concat([block, pass]));
		block = hash.digest();
		derived = Buffer.concat([derived, block]);
	}
	return {key: derived.slice(0, keyLen), iv: derived.slice(keyLen, keyLen + ivLen)};
}

function legacyDecrypt(encryptedData){
	const {key, iv} = evpBytesToKey(CRYPTOPASS, 24, 16); // aes-192-cbc: 24-byte key, 16-byte IV
	const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
	let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return JSON.parse(decrypted);
}

function encryptV2(data){
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', v2Key(), iv);
	let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const tag = cipher.getAuthTag().toString('hex');
	return V2_PREFIX + iv.toString('hex') + ':' + tag + ':' + encrypted;
}

function decryptV2(stored){
	const parts = stored.split(':');
	// parts[0] === "v2"
	const iv = Buffer.from(parts[1], 'hex');
	const tag = Buffer.from(parts[2], 'hex');
	const data = parts[3];
	const decipher = crypto.createDecipheriv('aes-256-gcm', v2Key(), iv);
	decipher.setAuthTag(tag);
	let decrypted = decipher.update(data, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return JSON.parse(decrypted);
}

// true when the stored value is a non-empty ciphertext in the old (legacy) format.
exports.isLegacyCiphertext = (stored) =>
	typeof stored === 'string' && stored.length > 0 && !stored.startsWith(V2_PREFIX);

exports.encrypt = (data) => encryptV2(data);

exports.decrypt = (stored) => {
	if(typeof stored === 'string' && stored.startsWith(V2_PREFIX))
		return decryptV2(stored);
	return legacyDecrypt(stored);
}

exports.cryptPassword = cryptPassword;
exports.generateAuthCode = () => cryptPassword(CODE_KEY+new Date().getTime());
