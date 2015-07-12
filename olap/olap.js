var http = require('http');
var xmla = require('./xmla.js');
var x = require('./x.js').x;
var url = require('url');
var textBody = require('body');
var xmlparse = require('./xmlparse.js').xmlparse;
var fs = require('fs');

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
  				};
  				// console.log(data.root);
  				// console.log(x(data.root,"Body/Discover"));

  				// data = data.root.children[0].children[0];

  
  				if(x(data.root,"Body/Discover")) {
	  				data = x(data.root,"Body/Discover");

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
//console.log(requestType);
  					self.discover(requestType, restrictions, properties,
  						function(err,data) {
						  	res.writeHead(200);
  							if(err) {
  								res.end('');
  							} else {
							  	res.end(soapPack(data, 'DiscoverResponse'));
  							}
  						}
  					);

				} else if(x(data.root,"Body/Execute")) {
					console.log('body execute');
	  				data = x(data.root,"Body/Execute");

  						//TODO Execute
  					var command, properties, parameters;
  					for(var i=0;i<data.children.length;i++) {
  						if(data.children[i].name === 'Command') {
  							command = data.children[i].children[0].content;
  						} else if(data.children[i].name === 'Properties') {
  							if(data.children[i].children[0] && data.children[i].children[0].name === 'PropertyList') {
	  							for(var k=0;k<data.children[i].children[0].children.length;k++) {
	  								var d = data.children[i].children[0].children[k];
	  								if(!properties) properties = {};
	  								properties[d.name] = d.content;
	  							}
  							}
  						} else if(data.children[i].name === 'Parameters') {
  							for(var k=0;k<data.children[i].children.length;k++) {
  								var d = data.children[i].children[k];
  								if(!parameters) parameters = {};
  								parameters[d.children[0].content] = d.children[1].content;
  							}
  						}
  					};
  					console.log(command, properties, parameters);
  					self.execute(command, properties, parameters,
  						function(err,data) {
						  	res.writeHead(200);
  							if(err) {
  								res.end(''); // Add error
  							} else {
							  	res.end(soapPack(data, 'ExecuteResponse'));
  							}
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

function soapPack(rs,responseType){
	var s = '';
	s += '<?xml version="1.0"?>';
	s += '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ';
	s += 'SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
	s += '<SOAP-ENV:Header> ';
	s += '</SOAP-ENV:Header>';
	s += '<SOAP-ENV:Body>';
	s += '<cxmla:'+responseType+' xmlns:cxmla="urn:schemas-microsoft-com:xml-analysis">';
	s += '<cxmla:return>';
	s += '<root xmlns="urn:schemas-microsoft-com:xml-analysis:rowset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:EX="urn:schemas-microsoft-com:xml-analysis:exception">';
	if(rs.columns) {
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

	} else if (rs.cells) {
		s += fs.readFileSync('olap/md.xml').toString();

		s += '<OlapInfo>';
		s += '<CubeInfo><Cube><CubeName>'+rs.cube+'</CubeName></Cube></CubeInfo>';
		s += '<AxesInfo>';
		rs.axis.forEach(function(axe){
			s += '<AxisInfo name="'+axe.name+'">';
			if(axe.hierarchy == 'Measures') {
				s += '<HierarchyInfo name="Measures">';
	              s += '<UName name="[Measures].[MEMBER_UNIQUE_NAME]"/>';
	              s += '<Caption name="[Measures].[MEMBER_CAPTION]"/>';
	              s += '<LName name="[Measures].[LEVEL_UNIQUE_NAME]"/>';
	              s += '<LNum name="[Measures].[LEVEL_NUMBER]"/>';
	              s += '<DisplayInfo name="[Measures].[DISPLAY_INFO]"/>';
	            s += '</HierarchyInfo>';
			};
			s += '</AxisInfo>';
		});
		s += '</AxesInfo>';

		s += '<CellInfo>';
        s += '<Value name="VALUE"/>';
        s += '<FmtValue name="FORMATTED_VALUE"/>';
        s += '<FormatString name="FORMAT_STRING"/>';
        s += '</CellInfo>';
        s += '</OlapInfo>';

        s += '<Axes>';
        rs.axis.forEach(function(axe){
        	s += '<Axis name="'+axe.name+'">';
    		s += '<Tuples>';
            s += '<Tuple>';
        	if(axe.hierarchy) {
	           s += '<Member Hierarchy="Measures">';
	           s += '<UName>[Measures].[qty]</UName>';
	           s += '<Caption>qty</Caption>';
	           s += '<LName>[Measures].[MeasuresLevel]</LName>';
	           s += '<LNum>0</LNum>';
	           s += '<DisplayInfo>0</DisplayInfo>';
	           s += '</Member>';
        	};
            s += '</Tuple>';
	        s += '</Tuples>';
        	s += '</Axis>';
        });
        s += '</Axes>';

        s += '<CellData>';
        rs.cells.forEach(function(cell){
        	s += '<Cell CellOrdinal="0">';
          	s += '<Value xsi:type="xsd:double">'+cell.Value+'</Value>';
          	s += '<FmtValue>'+cell.FmtValue+'</FmtValue>';
          	s += '<FormatString>'+(cell.FormatString||'')+'</FormatString>';
        	s += '</Cell>';
        });
      	s += '</CellData>';
	};

	s += '</root>';
	s += '</cxmla:return>';
	s += '</cxmla:'+responseType+'>';
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


OLAPServer.prototype.discover = function(requestType,restrictions,properties,cb){
	if(this.passthru) {
		this.client.discover(requestType,restrictions,properties,cb);
	} else {
			 if(requestType === 'DISCOVER_DATASOURCES') this.discoverDataSources(restrictions,properties,cb);
		else if(requestType === 'DISCOVER_PROPERTIES') this.discoverProperties(restrictions,properties,cb);
		else if(requestType === 'DBSCHEMA_CATALOGS') this.discoverDBCatalogs(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_CUBES') this.discoverMDCubes(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_MEASURES') this.discoverMDMeasures(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_MEASUREGROUPS') this.discoverMDMeasureGroups(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_KPIS') this.discoverMDKPIs(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_DIMENSIONS') this.discoverMDDimensions(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_HIERARCHIES') this.discoverMDHierarchies(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_LEVELS') this.discoverMDLevels(restrictions,properties,cb);
		else if(requestType === 'MDSCHEMA_MEASUREGROUP_DIMENSIONS') this.discoverMDMeasureGroupDimensions(restrictions,properties,cb);
	}
};

OLAPServer.prototype.execute = function(command,properties,parameters,cb){
	var self = this;
	if(self.passthru) {
		self.client.execute(command,properties,parameters,cb);
	} else {
		self.MDXParse(command, function(err,ast){
			if(err) {
				cb(err);
				return;
			}
			self.MDXExecute(ast,properties,parameters,cb);
		});

	}
};

OLAPServer.prototype.MDXParse = function(command,cb) {
	// Here we will have a parser
	cb(undefined,{});
};

OLAPServer.prototype.MDXExecute = function(ast,properties,parameters,cb){
	if(properties.Format == 'Multidimensional') {
		var cube = 'ParmesanoCube';
		var axis = [{name:'Axis(0)'},{name:'SlicerAxis'}];
		var cells = [{Value:'48',FmtValue:'48'}];
		cb(undefined,{cube:cube,axis:axis,cells:cells});
	} else {
		var columns =
	   [ { minOccurs: '0',
	       name: '_x005b_Measures_x005d_._x005b_qty_x005d_',
	       'sql:field': '[Measures].[qty]' } ];
		var rows =  [ { '_x005b_Measures_x005d_._x005b_qty_x005d_': '48' } ];

	    cb(undefined,{columns:columns,rows:rows});	
	};
};


OLAPServer.prototype.discoverDataSources = function(restrictions,properties,cb) {
	var columns = 
   [ { 'sql:field': 'DataSourceName',
       name: 'DataSourceName',
       type: 'xsd:string' },
     { 'sql:field': 'DataSourceDescription',
       name: 'DataSourceDescription',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'URL',
       name: 'URL',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DataSourceInfo',
       name: 'DataSourceInfo',
       type: 'xsd:string',
       minOccurs: '0' },	
     { 'sql:field': 'ProviderName',
       name: 'ProviderName',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'ProviderType',
       name: 'ProviderType',
       type: 'xsd:string',
       maxOccurs: 'unbounded' },
     { 'sql:field': 'AuthenticationMode',
       name: 'AuthenticationMode',
       type: 'xsd:string' } 
   ];

   var rows =    
   [ { DataSourceName: 'ParmesanoDS',
       DataSourceDescription: 'Parmesano Data Source',
       URL: 'http://localhost:'+this.port+this.path,
       DataSourceInfo: 'Parmesano Data Source Info',
       ProviderName: 'olap.js',
       ProviderType: ["MDX"],
       AuthenticationMode: 'Unauthenticated' } 
    ];

    cb(undefined,{columns:columns,rows:rows});
};

OLAPServer.prototype.discoverDBCatalogs = function(restrictions,properties,cb) {
	var columns =  [ 
	 { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string' },
     { 'sql:field': 'DESCRIPTION',
       name: 'DESCRIPTION',
       type: 'xsd:string' },
     { 'sql:field': 'ROLES', name: 'ROLES', type: 'xsd:string' },
     { 'sql:field': 'DATE_MODIFIED',
       name: 'DATE_MODIFIED',
       type: 'xsd:dateTime',
       minOccurs: '0' } ];
   	
var rows = [ { CATALOG_NAME: 'ParmesanoCatalog',
  DESCRIPTION: 'Parmesano demonstration model',
  ROLES: 'olap',
  DATE_MODIFIED: '2014-01-27T06:49:32' } ];

      cb(undefined,{columns:columns,rows:rows});
};

OLAPServer.prototype.discoverProperties = function(restrictions,properties,cb) {
	var columns = 
  [ { 'sql:field': 'PropertyName',
       name: 'PropertyName',
       type: 'xsd:string' },
     { 'sql:field': 'PropertyDescription',
       name: 'PropertyDescription',
       type: 'xsd:string' },
     { 'sql:field': 'PropertyType',
       name: 'PropertyType',
       type: 'xsd:string' },
     { 'sql:field': 'PropertyAccessType',
       name: 'PropertyAccessType',
       type: 'xsd:string' },
     { 'sql:field': 'IsRequired',
       name: 'IsRequired',
       type: 'xsd:boolean' },
     { 'sql:field': 'Value', name: 'Value', type: 'xsd:string' } ]
	;
   	var rows = [];
    cb(undefined,{columns:columns,rows:rows});
};
/*
OLAPServer.prototype.discoverDBCatalogs = function(restrictions,properties,cb) {
	var columns = 
   [ { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string' },
     { 'sql:field': 'SCHEMA_NAME',
       name: 'SCHEMA_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_NAME',
       name: 'CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_TYPE',
       name: 'CUBE_TYPE',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_GUID',
       name: 'CUBE_GUID',
       type: 'uuid',
       minOccurs: '0' },
     { 'sql:field': 'CREATED_ON',
       name: 'CREATED_ON',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'LAST_SCHEMA_UPDATE',
       name: 'LAST_SCHEMA_UPDATE',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'SCHEMA_UPDATED_BY',
       name: 'SCHEMA_UPDATED_BY',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'LAST_DATA_UPDATE',
       name: 'LAST_DATA_UPDATE',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'DATA_UPDATED_BY',
       name: 'DATA_UPDATED_BY',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DESCRIPTION',
       name: 'DESCRIPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'IS_DRILLTHROUGH_ENABLED',
       name: 'IS_DRILLTHROUGH_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_LINKABLE',
       name: 'IS_LINKABLE',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_WRITE_ENABLED',
       name: 'IS_WRITE_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_SQL_ENABLED',
       name: 'IS_SQL_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_CAPTION',
       name: 'CUBE_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'BASE_CUBE_NAME',
       name: 'BASE_CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_SOURCE',
       name: 'CUBE_SOURCE',
       type: 'xsd:unsignedShort',
       minOccurs: '0' } ];
  var rows =
   [ { CATALOG_NAME: 'Parmesano',
       CUBE_NAME: 'Parmesano',
       CUBE_TYPE: 'CUBE',
       LAST_SCHEMA_UPDATE: '2009-10-28T06:03:47',
       LAST_DATA_UPDATE: '2015-01-06T13:08:48',
       DESCRIPTION: undefined,
       IS_DRILLTHROUGH_ENABLED: 'true',
       IS_LINKABLE: 'true',
       IS_WRITE_ENABLED: 'false',
       IS_SQL_ENABLED: 'true',
       CUBE_CAPTION: 'Adventure Works',
       CUBE_SOURCE: '1' }];

    cb(undefined,{columns:columns,rows:rows});
};
*/
OLAPServer.prototype.discoverMDCubes = function(restrictions,properties,cb) {
	var columns = 
  [ { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string' },
     { 'sql:field': 'SCHEMA_NAME',
       name: 'SCHEMA_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_NAME',
       name: 'CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_TYPE',
       name: 'CUBE_TYPE',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_GUID',
       name: 'CUBE_GUID',
       type: 'uuid',
       minOccurs: '0' },
     { 'sql:field': 'CREATED_ON',
       name: 'CREATED_ON',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'LAST_SCHEMA_UPDATE',
       name: 'LAST_SCHEMA_UPDATE',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'SCHEMA_UPDATED_BY',
       name: 'SCHEMA_UPDATED_BY',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'LAST_DATA_UPDATE',
       name: 'LAST_DATA_UPDATE',
       type: 'xsd:dateTime',
       minOccurs: '0' },
     { 'sql:field': 'DATA_UPDATED_BY',
       name: 'DATA_UPDATED_BY',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DESCRIPTION',
       name: 'DESCRIPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'IS_DRILLTHROUGH_ENABLED',
       name: 'IS_DRILLTHROUGH_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_LINKABLE',
       name: 'IS_LINKABLE',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_WRITE_ENABLED',
       name: 'IS_WRITE_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_SQL_ENABLED',
       name: 'IS_SQL_ENABLED',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_CAPTION',
       name: 'CUBE_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'BASE_CUBE_NAME',
       name: 'BASE_CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_SOURCE',
       name: 'CUBE_SOURCE',
       type: 'xsd:unsignedShort',
       minOccurs: '0' } ];
  var rows = 
   [ { CATALOG_NAME: 'ParmesanoCatalog',
       CUBE_NAME: 'ParmesanoCube',
       CUBE_TYPE: 'CUBE',
       LAST_SCHEMA_UPDATE: '2009-10-28T06:03:47',
       LAST_DATA_UPDATE: '2015-01-06T13:08:48',
       DESCRIPTION: undefined,
       IS_DRILLTHROUGH_ENABLED: 'true',
       IS_LINKABLE: 'true',
       IS_WRITE_ENABLED: 'false',
       IS_SQL_ENABLED: 'true',
       CUBE_CAPTION: 'Parmesano',
       CUBE_SOURCE: '1' }
    ];

    cb(undefined,{columns:columns,rows:rows});
};

OLAPServer.prototype.discoverMDMeasures = function(restrictions,properties,cb) {
	var columns = 
  [ { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'SCHEMA_NAME',
       name: 'SCHEMA_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_NAME',
       name: 'CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_NAME',
       name: 'MEASURE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_UNIQUE_NAME',
       name: 'MEASURE_UNIQUE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_CAPTION',
       name: 'MEASURE_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_GUID',
       name: 'MEASURE_GUID',
       type: 'uuid',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_AGGREGATOR',
       name: 'MEASURE_AGGREGATOR',
       type: 'xsd:int',
       minOccurs: '0' },
     { 'sql:field': 'DATA_TYPE',
       name: 'DATA_TYPE',
       type: 'xsd:unsignedShort',
       minOccurs: '0' },
     { 'sql:field': 'NUMERIC_PRECISION',
       name: 'NUMERIC_PRECISION',
       type: 'xsd:unsignedShort',
       minOccurs: '0' },
     { 'sql:field': 'NUMERIC_SCALE',
       name: 'NUMERIC_SCALE',
       type: 'xsd:short',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_UNITS',
       name: 'MEASURE_UNITS',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DESCRIPTION',
       name: 'DESCRIPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'EXPRESSION',
       name: 'EXPRESSION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_IS_VISIBLE',
       name: 'MEASURE_IS_VISIBLE',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'LEVELS_LIST',
       name: 'LEVELS_LIST',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_NAME_SQL_COLUMN_NAME',
       name: 'MEASURE_NAME_SQL_COLUMN_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_UNQUALIFIED_CAPTION',
       name: 'MEASURE_UNQUALIFIED_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASUREGROUP_NAME',
       name: 'MEASUREGROUP_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASURE_DISPLAY_FOLDER',
       name: 'MEASURE_DISPLAY_FOLDER',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DEFAULT_FORMAT_STRING',
       name: 'DEFAULT_FORMAT_STRING',
       type: 'xsd:string',
       minOccurs: '0' } ];
  var rows =
   [ { CATALOG_NAME: 'ParmesanoCatalog',
       CUBE_NAME: 'ParmesanoCube',
       MEASURE_NAME: 'qty',
       MEASURE_UNIQUE_NAME: '[Measures].[qty]',
       MEASURE_CAPTION: 'Quantity',
       MEASURE_AGGREGATOR: '1',
       DATA_TYPE: '6',
       NUMERIC_PRECISION: '19',
       NUMERIC_SCALE: '4',
       DESCRIPTION: undefined,
       MEASURE_IS_VISIBLE: 'true',
       MEASURE_NAME_SQL_COLUMN_NAME: 'qty',
       MEASURE_UNQUALIFIED_CAPTION: 'qty',
       MEASUREGROUP_NAME: 'Sales',
       MEASURE_DISPLAY_FOLDER: undefined,
       DEFAULT_FORMAT_STRING: 'Currency' }];

    cb(undefined,{columns:columns,rows:rows});
};
OLAPServer.prototype.discoverMDKPIs = function(restrictions,properties,cb) {
	var columns = 
  [ { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'SCHEMA_NAME',
       name: 'SCHEMA_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_NAME',
       name: 'CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'MEASUREGROUP_NAME',
       name: 'MEASUREGROUP_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_NAME',
       name: 'KPI_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_CAPTION',
       name: 'KPI_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_DESCRIPTION',
       name: 'KPI_DESCRIPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_DISPLAY_FOLDER',
       name: 'KPI_DISPLAY_FOLDER',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_VALUE',
       name: 'KPI_VALUE',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_GOAL',
       name: 'KPI_GOAL',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_STATUS',
       name: 'KPI_STATUS',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_TREND',
       name: 'KPI_TREND',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_STATUS_GRAPHIC',
       name: 'KPI_STATUS_GRAPHIC',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_TREND_GRAPHIC',
       name: 'KPI_TREND_GRAPHIC',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_WEIGHT',
       name: 'KPI_WEIGHT',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_CURRENT_TIME_MEMBER',
       name: 'KPI_CURRENT_TIME_MEMBER',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'KPI_PARENT_KPI_NAME',
       name: 'KPI_PARENT_KPI_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'ANNOTATIONS',
       name: 'ANNOTATIONS',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'SCOPE',
       name: 'SCOPE',
       type: 'xsd:int',
       minOccurs: '0' } ];
  var rows = 
   [ { CATALOG_NAME: 'ParmesanoCatalog',
       CUBE_NAME: 'ParmesanoCube',
       MEASUREGROUP_NAME: 'Sales',
       KPI_NAME: 'Growth in Customer Base',
       KPI_CAPTION: 'Growth in Customer Base',
       KPI_DESCRIPTION: 'The ratio between the customer count in the current period to that of the previous period.',
       KPI_DISPLAY_FOLDER: 'Customer Perspective\\Expand Customer Base',
       KPI_VALUE: '[Measures].[Growth in Customer Base]',
       KPI_GOAL: '[Measures].[Growth in Customer Base Goal]',
       KPI_STATUS: '[Measures].[Growth in Customer Base Status]',
       KPI_TREND: '[Measures].[Growth in Customer Base Trend]',
       KPI_STATUS_GRAPHIC: 'Road Signs',
       KPI_TREND_GRAPHIC: 'Standard Arrow',
       KPI_WEIGHT: undefined,
       KPI_PARENT_KPI_NAME: undefined,
       ANNOTATIONS: undefined,
       SCOPE: '1' }];

    cb(undefined,{columns:columns,rows:rows});
};
OLAPServer.prototype.discoverMDDimensions = function(restrictions,properties,cb) {
	var columns = 
 [ { 'sql:field': 'CATALOG_NAME',
       name: 'CATALOG_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'SCHEMA_NAME',
       name: 'SCHEMA_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'CUBE_NAME',
       name: 'CUBE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_NAME',
       name: 'DIMENSION_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_UNIQUE_NAME',
       name: 'DIMENSION_UNIQUE_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_GUID',
       name: 'DIMENSION_GUID',
       type: 'uuid',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_CAPTION',
       name: 'DIMENSION_CAPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_ORDINAL',
       name: 'DIMENSION_ORDINAL',
       type: 'xsd:unsignedInt',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_TYPE',
       name: 'DIMENSION_TYPE',
       type: 'xsd:short',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_CARDINALITY',
       name: 'DIMENSION_CARDINALITY',
       type: 'xsd:unsignedInt',
       minOccurs: '0' },
     { 'sql:field': 'DEFAULT_HIERARCHY',
       name: 'DEFAULT_HIERARCHY',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DESCRIPTION',
       name: 'DESCRIPTION',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'IS_VIRTUAL',
       name: 'IS_VIRTUAL',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'IS_READWRITE',
       name: 'IS_READWRITE',
       type: 'xsd:boolean',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_UNIQUE_SETTINGS',
       name: 'DIMENSION_UNIQUE_SETTINGS',
       type: 'xsd:int',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_MASTER_NAME',
       name: 'DIMENSION_MASTER_NAME',
       type: 'xsd:string',
       minOccurs: '0' },
     { 'sql:field': 'DIMENSION_IS_VISIBLE',
       name: 'DIMENSION_IS_VISIBLE',
       type: 'xsd:boolean',
       minOccurs: '0' } ];

     var rows =    [ { CATALOG_NAME: 'ParmesanoCatalog',
       CUBE_NAME: 'ParmesanoCube',
       DIMENSION_NAME: 'dept',
       DIMENSION_UNIQUE_NAME: '[dept]',
       DIMENSION_CAPTION: 'dept',
       DIMENSION_ORDINAL: '5',
       DIMENSION_TYPE: '7',
       DIMENSION_CARDINALITY: '18485',
       DEFAULT_HIERARCHY: '[dept].[All]',
       DESCRIPTION: undefined,
       IS_VIRTUAL: 'false',
       IS_READWRITE: 'false',
       DIMENSION_UNIQUE_SETTINGS: '1',
       DIMENSION_MASTER_NAME: 'dept',
       DIMENSION_IS_VISIBLE: 'true' }];

    cb(undefined,{columns:columns,rows:rows});
};
OLAPServer.prototype.discoverMDHierarchies = function(restrictions,properties,cb) {
	var columns = [ { 'sql:field': 'CATALOG_NAME',
    name: 'CATALOG_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'SCHEMA_NAME',
    name: 'SCHEMA_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'CUBE_NAME',
    name: 'CUBE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_UNIQUE_NAME',
    name: 'DIMENSION_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_NAME',
    name: 'HIERARCHY_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_UNIQUE_NAME',
    name: 'HIERARCHY_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_GUID',
    name: 'HIERARCHY_GUID',
    type: 'uuid',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_CAPTION',
    name: 'HIERARCHY_CAPTION',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_TYPE',
    name: 'DIMENSION_TYPE',
    type: 'xsd:short',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_CARDINALITY',
    name: 'HIERARCHY_CARDINALITY',
    type: 'xsd:unsignedInt',
    minOccurs: '0' },
  { 'sql:field': 'DEFAULT_MEMBER',
    name: 'DEFAULT_MEMBER',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'ALL_MEMBER',
    name: 'ALL_MEMBER',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DESCRIPTION',
    name: 'DESCRIPTION',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'STRUCTURE',
    name: 'STRUCTURE',
    type: 'xsd:short',
    minOccurs: '0' },
  { 'sql:field': 'IS_VIRTUAL',
    name: 'IS_VIRTUAL',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'IS_READWRITE',
    name: 'IS_READWRITE',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_UNIQUE_SETTINGS',
    name: 'DIMENSION_UNIQUE_SETTINGS',
    type: 'xsd:int',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_MASTER_UNIQUE_NAME',
    name: 'DIMENSION_MASTER_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_IS_VISIBLE',
    name: 'DIMENSION_IS_VISIBLE',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_ORDINAL',
    name: 'HIERARCHY_ORDINAL',
    type: 'xsd:unsignedInt',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_IS_SHARED',
    name: 'DIMENSION_IS_SHARED',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_IS_VISIBLE',
    name: 'HIERARCHY_IS_VISIBLE',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_ORIGIN',
    name: 'HIERARCHY_ORIGIN',
    type: 'xsd:unsignedShort',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_DISPLAY_FOLDER',
    name: 'HIERARCHY_DISPLAY_FOLDER',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'INSTANCE_SELECTION',
    name: 'INSTANCE_SELECTION',
    type: 'xsd:unsignedShort',
    minOccurs: '0' },
  { 'sql:field': 'GROUPING_BEHAVIOR',
    name: 'GROUPING_BEHAVIOR',
    type: 'xsd:unsignedShort',
    minOccurs: '0' } ] ;

  var rows = [{ CATALOG_NAME: 'ParmesanoCatalog',
  CUBE_NAME: 'ParmesanoCube',
  DIMENSION_UNIQUE_NAME: '[dept]',
  HIERARCHY_NAME: 'Address',
  HIERARCHY_UNIQUE_NAME: '[dept].[Address]',
  HIERARCHY_CAPTION: 'Address',
  DIMENSION_TYPE: '7',
  HIERARCHY_CARDINALITY: '12799',
  DEFAULT_MEMBER: '[Customer].[Address].[All Customers]',
  ALL_MEMBER: '[Customer].[Address].[All Customers]',
  DESCRIPTION: undefined,
  STRUCTURE: '0',
  IS_VIRTUAL: 'false',
  IS_READWRITE: 'false',
  DIMENSION_UNIQUE_SETTINGS: '1',
  DIMENSION_IS_VISIBLE: 'true',
  HIERARCHY_ORDINAL: '20',
  DIMENSION_IS_SHARED: 'true',
  HIERARCHY_IS_VISIBLE: 'true',
  HIERARCHY_ORIGIN: '2',
  HIERARCHY_DISPLAY_FOLDER: 'Location',
  INSTANCE_SELECTION: '4',
  GROUPING_BEHAVIOR: '2' }];

    cb(undefined,{columns:columns,rows:rows});
};
OLAPServer.prototype.discoverMDLevels = function(restrictions,properties,cb) {
var columns = [ { 'sql:field': 'CATALOG_NAME',
    name: 'CATALOG_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'SCHEMA_NAME',
    name: 'SCHEMA_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'CUBE_NAME',
    name: 'CUBE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_UNIQUE_NAME',
    name: 'DIMENSION_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'HIERARCHY_UNIQUE_NAME',
    name: 'HIERARCHY_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_NAME',
    name: 'LEVEL_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_UNIQUE_NAME',
    name: 'LEVEL_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_GUID',
    name: 'LEVEL_GUID',
    type: 'uuid',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_CAPTION',
    name: 'LEVEL_CAPTION',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_NUMBER',
    name: 'LEVEL_NUMBER',
    type: 'xsd:unsignedInt',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_CARDINALITY',
    name: 'LEVEL_CARDINALITY',
    type: 'xsd:unsignedInt',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_TYPE',
    name: 'LEVEL_TYPE',
    type: 'xsd:int',
    minOccurs: '0' },
  { 'sql:field': 'DESCRIPTION',
    name: 'DESCRIPTION',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'CUSTOM_ROLLUP_SETTINGS',
    name: 'CUSTOM_ROLLUP_SETTINGS',
    type: 'xsd:int',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_UNIQUE_SETTINGS',
    name: 'LEVEL_UNIQUE_SETTINGS',
    type: 'xsd:int',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_IS_VISIBLE',
    name: 'LEVEL_IS_VISIBLE',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_ORDERING_PROPERTY',
    name: 'LEVEL_ORDERING_PROPERTY',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_DBTYPE',
    name: 'LEVEL_DBTYPE',
    type: 'xsd:int',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_MASTER_UNIQUE_NAME',
    name: 'LEVEL_MASTER_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_NAME_SQL_COLUMN_NAME',
    name: 'LEVEL_NAME_SQL_COLUMN_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_KEY_SQL_COLUMN_NAME',
    name: 'LEVEL_KEY_SQL_COLUMN_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_UNIQUE_NAME_SQL_COLUMN_NAME',
    name: 'LEVEL_UNIQUE_NAME_SQL_COLUMN_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_ATTRIBUTE_HIERARCHY_NAME',
    name: 'LEVEL_ATTRIBUTE_HIERARCHY_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_KEY_CARDINALITY',
    name: 'LEVEL_KEY_CARDINALITY',
    type: 'xsd:unsignedShort',
    minOccurs: '0' },
  { 'sql:field': 'LEVEL_ORIGIN',
    name: 'LEVEL_ORIGIN',
    type: 'xsd:unsignedShort',
    minOccurs: '0' } ]
var rows = [ { CATALOG_NAME: 'Parmesano',
  CUBE_NAME: 'Parmesano',
  DIMENSION_UNIQUE_NAME: '[Customer]',
  HIERARCHY_UNIQUE_NAME: '[Customer].[Address]',
  LEVEL_NAME: '(All)',
  LEVEL_UNIQUE_NAME: '[Customer].[Address].[(All)]',
  LEVEL_CAPTION: '(All)',
  LEVEL_NUMBER: '0',
  LEVEL_CARDINALITY: '1',
  LEVEL_TYPE: '1',
  DESCRIPTION: undefined,
  CUSTOM_ROLLUP_SETTINGS: '0',
  LEVEL_UNIQUE_SETTINGS: '0',
  LEVEL_IS_VISIBLE: 'true',
  LEVEL_ORDERING_PROPERTY: '(All)',
  LEVEL_DBTYPE: '3',
  LEVEL_KEY_CARDINALITY: '1',
  LEVEL_ORIGIN: '2' } ];

      cb(undefined,{columns:columns,rows:rows});
};

OLAPServer.prototype.discoverMDMeasureGroupDimensions = function(restrictions,properties,cb) {
var columns = [ { 'sql:field': 'CATALOG_NAME',
    name: 'CATALOG_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'SCHEMA_NAME',
    name: 'SCHEMA_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'CUBE_NAME',
    name: 'CUBE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'MEASUREGROUP_NAME',
    name: 'MEASUREGROUP_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'MEASUREGROUP_CARDINALITY',
    name: 'MEASUREGROUP_CARDINALITY',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_UNIQUE_NAME',
    name: 'DIMENSION_UNIQUE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_CARDINALITY',
    name: 'DIMENSION_CARDINALITY',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_IS_VISIBLE',
    name: 'DIMENSION_IS_VISIBLE',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_IS_FACT_DIMENSION',
    name: 'DIMENSION_IS_FACT_DIMENSION',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'DIMENSION_PATH',
    name: 'DIMENSION_PATH',
    minOccurs: '0',
    maxOccurs: 'unbounded' },
  { 'sql:field': 'DIMENSION_GRANULARITY',
    name: 'DIMENSION_GRANULARITY',
    type: 'xsd:string',
    minOccurs: '0' } ];

var rows = [ { CATALOG_NAME: 'ParmesanoCatalog',
  CUBE_NAME: 'ParmesanoCube',
  MEASUREGROUP_NAME: 'Clustered CustomersMG',
  MEASUREGROUP_CARDINALITY: 'ONE',
  DIMENSION_UNIQUE_NAME: '[dept]',
  DIMENSION_CARDINALITY: 'MANY',
  DIMENSION_IS_VISIBLE: 'true',
  DIMENSION_IS_FACT_DIMENSION: 'false',
  DIMENSION_GRANULARITY: '[dept].[Node Unique Name]' } ];
    cb(undefined,{columns:columns,rows:rows});
};


OLAPServer.prototype.discoverMDMeasureGroups = function(restrictions,properties,cb) {
var columns = [ { 'sql:field': 'CATALOG_NAME',
    name: 'CATALOG_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'SCHEMA_NAME',
    name: 'SCHEMA_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'CUBE_NAME',
    name: 'CUBE_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'MEASUREGROUP_NAME',
    name: 'MEASUREGROUP_NAME',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'DESCRIPTION',
    name: 'DESCRIPTION',
    type: 'xsd:string',
    minOccurs: '0' },
  { 'sql:field': 'IS_WRITE_ENABLED',
    name: 'IS_WRITE_ENABLED',
    type: 'xsd:boolean',
    minOccurs: '0' },
  { 'sql:field': 'MEASUREGROUP_CAPTION',
    name: 'MEASUREGROUP_CAPTION',
    type: 'xsd:string',
    minOccurs: '0' } ];

var rows = [ { CATALOG_NAME: 'ParmesanoCatalog',
  CUBE_NAME: 'ParmesanoCube',
  MEASUREGROUP_NAME: 'Sales',
  DESCRIPTION: undefined,
  IS_WRITE_ENABLED: 'false',
  MEASUREGROUP_CAPTION: 'Sales' } ];    
  cb(undefined,{columns:columns,rows:rows});
};



