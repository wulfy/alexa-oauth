const http = require('http');
const https = require('https');
const {decrypt} = require('./security');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //self signed ssl certificate
const STATUS_COMMAND = "json.htm?type=devices&rid=0";

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
function promiseHttpRequest (request,options) {
    const requestLower = request.toLowerCase();
    const httpOrHttps = requestLower.includes("https") ? https : http;

    return new Promise ((resolve, reject) => {
        httpOrHttps.get(request, options, (resp) => {
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
        	s.setTimeout(1000, () => { 
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
	const { domain,proto } = extractDomoticzUrlData(userData.domoticzHost);
	const domoticzPort = userData.domoticzPort;
	const domoticzLogin = userData.domoticzLogin;
	console.log("decrypt");
	const domoticzPassword = decrypt(userData.domoticzPassword);
	const query = `${proto}://${domain}:${domoticzPort}/${STATUS_COMMAND}`;
  const basicAuth = 'Basic ' + Buffer.from(`${domoticzLogin}:${domoticzPassword}`).toString('base64');
  const options = {
    headers: {
      'Authorization': basicAuth,
    }
  };

	console.log("query");
	console.log(query);
	const domoticzVersion = await promiseHttpRequest(query,options);
	const domoticzVersionObj = JSON.parse(domoticzVersion);
	console.log(domoticzVersionObj);
	return domoticzVersionObj.status;
}