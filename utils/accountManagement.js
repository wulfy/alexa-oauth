const {getDatabase} = require('./database')
var {cryptPassword,comparePassword} = require('./security');

connectionDatabase = getDatabase();

exports.createAccount = (email,password)=>{

	return connectionDatabase.query('INSERT INTO  users(email, password) VALUES (?, ?)', 
    [
     email,
     cryptPassword(password),
     ]).then( result => {
     	console.log(result.insertId);
     	return result;
     });
}

exports.createData = (uid)=>{

	return connectionDatabase.query(`INSERT INTO  user_data(user_id,domoticzHost,domoticzPort,domoticzLogin,domoticzPassword) 
									 VALUES (?, '', 0 , '' ,'' )`, 
    [uid]).then( result => result);
}

exports.checkExistsEmail = (email)=>{
	console.log("search for" + email)
	return connectionDatabase.query('SELECT email FROM users WHERE email = ?', 
    [email]).then( results => {
    	console.log(results[0])
        return results[0];
    });
}

exports.getUserAccount = (email,plainPassword)=>{
	console.log("search for" + email + plainPassword)
	const password = cryptPassword(plainPassword);
	return connectionDatabase.query(`SELECT * FROM users 
									 WHERE email = ? `, 
    [email]).then( results => {
    	console.log("found user: ");
    	console.log(results[0])
    	let user = results[0];
    	if(!user || !comparePassword(plainPassword,user.password)) 
    		return false;

    	user.password = null;//remove password from answer for security reasons
    	return user;
    });
}

exports.getUserData = (uid)=>{
	return connectionDatabase.query(`SELECT us.id as uid,us.*,ud.* FROM users as us 
									 LEFT JOIN user_data as ud ON us.id = ud.user_id 
									 WHERE us.id = ? `, 
    [uid]).then( results => {
    	console.log("found user data: ");
    	console.log(results[0])
    	let user = results[0];
    	if(!user) 
    		return false;

    	user.password = null;//remove password from answer for security reasons
    	return user;
    });
}

exports.updateUserData = (uid,domoticzHost,domoticzPort,domoticzLogin,domoticzPassword)=>{
	return connectionDatabase.query(`UPDATE user_data SET 
									domoticzHost = ?,
									domoticzPort = ?,
									domoticzLogin = ?,
									domoticzPassword = ? 
									WHERE user_id = ?`, 
    [domoticzHost,domoticzPort,domoticzLogin,domoticzPassword,uid]).then( results => {
    	let data = results[0];
    	if(!data) 
    		return false;

    	return data;
    });
}

