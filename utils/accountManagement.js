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

    	//user.password = null;//remove password from answer for security reasons
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

exports.updateUser = (uid,userEmail,userPassword)=>{

    if(!userEmail || !userPassword)
        throw("Email and Password are mandatory ! ");

    const encryptedPassword = cryptPassword(userPassword);
    return connectionDatabase.query(`UPDATE users SET 
                                    email = ?,
                                    password = ?
                                    WHERE id = ?`, 
    [userEmail,encryptedPassword,uid]).then( results => {
        let data = results[0];
        if(!data) 
            return false;

        return data;
    });
}

exports.getPassCode = (code)=>{
    const currentDate = new Date();
    return connectionDatabase.query(`SELECT us.*,lp.expires  FROM users as us 
                                     INNER JOIN lost_pass as lp on lp.user_id = us.id 
                                     WHERE lp.code = ? AND lp.expires >= ?`, 
    [code,currentDate]).then( results => {
        let data = results[0];
        if(!data) 
            return false;

        return data;
    });
}

exports.revokeLostPasswordCode = (code) =>{
    return connectionDatabase.query(`UPDATE lost_pass SET 
                                    expires = '2018-08-08 00:00:00'
                                    WHERE code = ?`, 
    [code]).then( results => {
        let data = results[0];
        return data;
    });
}

exports.saveLostPassCode = (user,code,expires)=>{
    return connectionDatabase.query(`INSERT INTO lost_pass(user_id, email, code, expires) VALUES (?,?,?,?)`, 
    [user.id,user.email,code,expires]).then( results => {
        let data = results[0];
        if(!data) 
            return false;

        return data;
    });
}

exports.getUserByMail = (email)=>{
    return connectionDatabase.query(`SELECT * FROM users where email = ?`, 
    [email]).then( results => {
        let data = results[0];
        if(!data) 
            return false;

        return data;
    });
}


