//
// Fake pas-thru server
// 

var XMLHttpRequest = require("xhr2").XMLHttpRequest;
var http = require('http');
var url = require('url');
var textBody = require('body');


function POST(path,body,async,cb){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (cb){
                  cb(undefined,xhr.responseText);
              }
          } else if (error){
              cb(xhr);
          }
          // Todo: else...?            
      }
  };
  xhr.open("POST", path, async); // Async
  xhr.setRequestHeader("Accept", "text/xml, application/xml, application/soap+xml");
  xhr.setRequestHeader("Content-Type", "text/xml");
  xhr.send(body);
};

	// Default values
var path = '/xmla';


http.createServer(function (req, res) {
	//console.log(req.method);
//		CORS(req,res);

  	res.setHeader("Access-Control-Allow-Origin","*");
  	res.setHeader("Access-Control-Allow-Credentials",true);
	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept");
	res.setHeader("Access-Control-Allow-Methods", "HEAD, POST, GET, OPTIONS");
	res.setHeader('Accept','*/*');

	if(req.method == 'OPTIONS') {
		res.setHeader('Content-Length',0);
	  	res.writeHead(200);
		res.end('');						
	} else if(req.method == 'POST' && url.parse(req.url, true).path === path) {
		res.setHeader("Content-Type", "text/xml");
  		textBody(req,function(err,body){
  			if(err) {
  				console.log('Error in textBody',err);
  				res.end('');
  				return;
  			}

			if(!body) {
					console.log('Error body',body);
			  	res.writeHead(200);
					res.end('');
					return;
			}


			console.log('=== QUERY ====');
			console.log();
			console.log(body);
			console.log();

			POST('http://sampledata.infragistics.com/olap/msmdpump.dll',body,true,function(err,data) {
			  	res.writeHead(200);
				if(err) {
					res.end(''); // Add error
				} else {
					console.log();
					console.log('=== ANSWER ====');
					console.log();
					console.log(data);
					console.log();
				  	res.end(data);
				}
				});
				// Send answer
  		});
  		// get body!
  };
}).listen(6000, '127.0.0.1');	

