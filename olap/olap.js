var http = require('http');
var xmla = require('./xmla.js');
var url = require('url');
var textBody = require('body');
var xmlparse = require('./xmlparse.js').xmlparse;

function extend(dest, src) {
  for(var p in src) {
    if(src.hasOwnProperty(p)) {
      dest[p] = src[p];
    }
  }
};

var OLAPServer = function(params) {
	var self = this;

	// Default values
	self.path = '/xmla';

	if(typeof params == 'number') {
		this.port = params;
	} else if(typeof params == 'object') {
		extend(this,params);
	};

	if(self.passthru) this.client = xmla.client(self.passthru);

	http.createServer(function (req, res) {
		console.log(req.method);
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
		} else if(req.method == 'POST' && url.parse(req.url, true).path === self.path) {
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
  				var data = xmlparse(body);
//console.log(45,data.root);
  				if(!data.root) {
  					console.log('Bad XML body',body);
				  	res.writeHead(200);
  					res.end('');
  					return;
  				}

  				data = data.root.children[0].children[0];
//  				console.log(data);
  				if(data.name === 'Discover') {
  					var requestType, restrictions, properties;
  					for(var i=0;i<data.children.length;i++) {
  						if(data.children[i].name === 'RequestType') {
  							requestType = data.children[i].content;
  						} else if(data.children[i].name === 'Restrictions') {
  							if(data.children[i].children[0] && data.children[i].children[0].name === 'RestrictionList') {
	  							for(var k=0;k<data.children[i].children[0].children.length;k++) {
	  								var d = data.children[i].children[0].children[k];
	  								if(!restrictions) restrictions = {};
	  								restrictions[d.name] = d.content;
	  							}
  							}
  						} else if(data.children[i].name === 'Properties') {
  							if(data.children[i].children[0] && data.children[i].children[0].name === 'PropertyList') {
	  							for(var k=0;k<data.children[i].children[0].children.length;k++) {
	  								var d = data.children[i].children[0].children[k];
	  								if(!properties) properties = {};
	  								properties[d.name] = d.content;
	  							}
  							}

  						}
  					}

  					self.client.discover(requestType, restrictions, properties,
  						function(data) {
						  	res.writeHead(200);
						  	res.end(soapPack(data));
  						}
  					);


  				}
  				// Send answer
	  		});
	  		// get body!
	  };
	}).listen(this.port, '127.0.0.1');	

	return this;
};

exports.server = function(params) {
	return new OLAPServer(params);
};

function soapPack(rs){
	var s = '';
	s += '<?xml version="1.0"?>';
	s += '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ';
	s += 'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
	s += '<SOAP-ENV:Header> ';
	s += '</SOAP-ENV:Header>';
	s += '<SOAP-ENV:Body>';
	s += '<cxmla:DiscoverResponse xmlns:cxmla="urn:schemas-microsoft-com:xml-analysis">';
	s += '<cxmla:return>';
	s += '<root xmlns="urn:schemas-microsoft-com:xml-analysis:rowset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:EX="urn:schemas-microsoft-com:xml-analysis:exception">';
	s += '<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="urn:schemas-microsoft-com:xml-analysis:rowset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sql="urn:schemas-microsoft-com:xml-sql" targetNamespace="urn:schemas-microsoft-com:xml-analysis:rowset" elementFormDefault="qualified">';

	s += '<xsd:element name="root">';
	s += 	'<xsd:complexType>'
    s +=         '<xsd:sequence>'
    s +=           '<xsd:element name="row" type="row" minOccurs="0" maxOccurs="unbounded"/>'
    s +=         '</xsd:sequence>'
    s +=    '</xsd:complexType>'
    s += '</xsd:element>';

    s += '<xsd:simpleType name="uuid">';
    s +=       '<xsd:restriction base="xsd:string">';
    s +=         '<xsd:pattern value="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"/>';
    s +=       '</xsd:restriction>';
    s += '</xsd:simpleType>';

	
	s += '<xsd:complexType name="row">';
	s += '<xsd:sequence>';

	// Add colums schema
	for(var j=0;j<rs.columns.length;j++) {
		s += '<xsd:element ';
		var ss = [];
		for(var k in rs.columns[j]) {
			ss.push(k+'="'+rs.columns[j][k]+'"');
		};
		s += ss.join(' ')+'/>';
	};

	s += '</xsd:sequence>';
	s += '</xsd:complexType>';

	s += '</xsd:schema>';
	// Add rows
	for(var i=0;i<rs.rows.length;i++) {
		s += '<row>';
		for(var j=0;j<rs.columns.length;j++) {
			if(typeof rs.rows[i][rs.columns[j].name] !== 'undefined') {
				s += '<'+rs.columns[j].name +'>';
				s += rs.rows[i][rs.columns[j].name];
				s += '</'+rs.columns[j].name +'>';				
			}
		};
		s += '</row>';
	}

	s += '</root>';
	s += '</cxmla:return>';
	s += '</cxmla:DiscoverResponse>';
	s += '</SOAP-ENV:Body>';
	s += '</SOAP-ENV:Envelope>';
//	console.log(s);
	return s;
}

function CORS(req, res) {
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
        res.send(200);
    } else {
//        next();
    }
};	
