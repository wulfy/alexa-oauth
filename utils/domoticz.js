const http = require('http');
const https = require('https');
const {decrypt} = require('./security');
const {debugLogger} = require('./logger')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //self signed ssl certificate
const STATUS_COMMAND = "json.htm?type=devices&rid=0";
const STATUS_COMMAND_20232 = "json.htm?type=devices&rid=0";
const VERSION = "json.htm?type=command&param=getversion";

function extractDomoticzUrlData (request) {
  let domoticzUrlData = {domain:null,proto:"http"};
  const result = request.split("//").map((value)=>value.split(":")[0]);

  if(result.length > 1)
  {
      domoticzUrlData.proto = result[0];
      domoticzUrlData.domain = result[1];
  }else{
      domoticzUrlData.domain = result[0];
  }

  return domoticzUrlData;
}


// do a promise http request
function promiseHttpRequest (options) {
    const protoLower = options.proto.toLowerCase();
    const httpOrHttps = protoLower.includes("https") ? https : http;

    return new Promise ((resolve, reject) => {
        httpOrHttps.get(options, (resp) => {
          let data = '';
          // A chunk of data has been recieved.
          resp.on('data', (chunk) => {
            data += chunk;
          });
        
          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            debugLogger("END PROMISE");
            resolve(data);
          });
        
        }).on('socket', (s) => { 
        	s.setTimeout(1000, () => { 
        		console.log("TIMEOUT")
        		s.destroy(); 
        	})
    	}).on("error", (err) => {
	          debugLogger("Error: " + err.message);
	          reject(err);
	        })
    })
}

exports.checkDomoticz = async (userData)=>{
	console.log("check");
	const { domain,proto } = extractDomoticzUrlData(userData.domoticzHost);
	const domoticzPort = userData.domoticzPort;
	const domoticzLogin = userData.domoticzLogin;
	console.log("decrypt");
	const domoticzPassword = decrypt(userData.domoticzPassword);
  const basicAuth = 'Basic ' + Buffer.from(`${domoticzLogin}:${domoticzPassword}`).toString('base64');
  const options = {
    proto:proto,
    hostname: domain,
    port: domoticzPort,
    path: '/'+VERSION,
    method: 'GET',
    headers: {
      'Authorization': basicAuth,
    }
  };

	debugLogger("query");
	debugLogger(options);
	const domoticzVersion = await promiseHttpRequest(options);
	const domoticzVersionObj = JSON.parse(domoticzVersion);
	console.log(domoticzVersionObj);
	return domoticzVersionObj.status;
}