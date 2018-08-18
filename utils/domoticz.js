const http = require('http');
const {decrypt} = require('./security');


const STATUS_COMMAND = "json.htm?type=command&param=getversion";


// do a promise http request
function promiseHttpRequest (request) {
    return new Promise ((resolve, reject) => {
        http.get(request, (resp) => {
          let data = '';
          // A chunk of data has been recieved.
          resp.on('data', (chunk) => {
            data += chunk;
          });
        
          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            console.log("END PROMISE");
            resolve(data);
          });
        
        }).on('socket', (s) => { 
        	s.setTimeout(100, () => { 
        		console.log("TIMEOUT")
        		s.destroy(); 
        	})
    	}).on("error", (err) => {
	          console.log("Error: " + err.message);
	          reject(err);
	        })
    })
}


exports.checkDomoticz = async (userData)=>{
	console.log("check");
	const domoticzHost = userData.domoticzHost;
	const domoticzPort = userData.domoticzPort;
	const domoticzLogin = userData.domoticzLogin;
	console.log("decrypt");
	const domoticzPassword = decrypt(userData.domoticzPassword);
	const query = `http://${domoticzLogin}:${domoticzPassword}@${domoticzHost}:${domoticzPort}/${STATUS_COMMAND}`;
	console.log("query");
	console.log(query);
	const domoticzVersion = await promiseHttpRequest(query);
	const domoticzVersionObj = JSON.parse(domoticzVersion);
	console.log(domoticzVersionObj);
	return domoticzVersionObj.status;
}