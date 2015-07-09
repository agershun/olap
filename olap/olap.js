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
	  if(url.parse(req.url, true).path === self.path) {
	  		textBody(req,function(err,body){
  				var data = xmlparse(body).root.children[0].children[0];
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
						  	res.writeHead(200, {'Content-Type': 'text/plain'});
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
	s += 'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"> <SOAP-ENV:Body>';
	s += '<m:ExecuteResponse xmlns:m="urn:schemas-microsoft-com:xml-analysis">';
	s += '<m:return SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
	s += '<root xmlns="urn:schemas-microsoft-com:xml-analysis:mddataset">';
	s += '<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xars="urn:schemas-microsoft-com:xars">';

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
		for(var k in rs.columns[j]) {
			s += k+'="'+rs.columns[j][k]+'" ';
		};
		s += '/>';
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
	s += '</m:return>';
	s += '</m:ExecuteResponse>';
	s += '</SOAP-ENV:Body>';
	s += '</SOAP-ENV:Envelope>';
	console.log(s);
	return s;
}

