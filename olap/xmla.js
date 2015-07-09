﻿/**
	(c) 2015 Andrey Gershun
*/

/* Rowset
<root xmlns="urn:schemas-microsoft-com:xml-analysis:rowset">
   <!-- The following elements extend Resultset -->
   <!-- Optional schema elements -->
   <row>...</row>
</root>

*/

/* MDDataSet

<root xmlns="urn:schemas-microsoft-com:xml-analysis:rowset">
   <!-- The following elements extend Resultset -->
   <!-- Optional schema elements -->
   <OlapInfo>...</OlapInfo>
   <Axes>...</Axes>
   <CellData>...</CellData>
</root>

*/


if(typeof exports == 'object') {
	//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	var XMLHttpRequest = require("xhr2").XMLHttpRequest;
  var xmlparse = require('./xmlparse.js').xmlparse;
};

// function GET(path,cb){
//     var xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === XMLHttpRequest.DONE) {
//             if (xhr.status === 200) {
//                 if (success){
//                     success(cutbom(xhr.responseText));
//                 }
//             } else if (error){
//                 error(xhr);
//             }
//             // Todo: else...?            
//         }
//     };
//     xhr.open("GET", path, false); // Async
//     xhr.send();
// };

/**
  @function POST-request
*/
function POST(path,body,async,success,error){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success){
                  success(xhr.responseText);
              }
          } else if (error){
              error(xhr);
          }
          // Todo: else...?            
      }
  };
  xhr.open("POST", path, async); // Async
  xhr.setRequestHeader("Accept", "text/xml, application/xml, application/soap+xml");
  xhr.setRequestHeader("Content-Type", "text/xml");
  xhr.send(body);
};


function extend(dest, src) {
  for(var p in src) {
    if(src.hasOwnProperty(p)) {
      dest[p] = src[p];
    }
  }

	// Extend
};



/**
	@class XMLAClient
*/

var XMLAClient = function(params) {
	// Set parameters
	if(typeof params == 'string') {
		this.url = params;
	} else if(typeof params == 'object') {
		extend(this,params);
	};
	return this;
};

/**
	@function Return new XMLA client
	@param {object} params Parameters
	@return {object} XMLAClient
*/
exports.client = function(params) {
	return new XMLAClient(params);
};


var SOAPEnvelope = function(body) {
  var s = '<?xml version="1.0" encoding="UTF-8"?>';
  s += '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"';
  s += ' SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
  s += '<SOAP-ENV:Body>';
  s += body;
  s += ' </SOAP-ENV:Body>';
  s += '</SOAP-ENV:Envelope>';
  return s;
};


/** XMLA functions */

XMLAClient.prototype.discover = function(requestType, restrictions, properties, async, cb) {
  if(typeof restrictions === 'function') {
    cb = restrictions;
    restrictions = undefined;
    properties = undefined;
    async = true;
  } else if(typeof properties === 'function') {;
    cb = properties;
    properties = undefined;
    async = true;
  } else if(typeof async === 'function') {;
    cb = async;
    async = true;
  };

/*
<Discover>
   <RequestType>...</RequestType>
   <Restrictions>...</Restrictions>
   <Properties>...</Properties>
</Discover>
*/

  var s = '<Discover xmlns="urn:schemas-microsoft-com:xml-analysis"';
  s += ' SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
  
  // Request type
  s += '<RequestType>'+requestType+'</RequestType>';
  
  // Restrictions
  s += '<Restrictions>';
  s += '<RestrictionList>';

  for(var rest in restrictions) {
    s += '<'+rest+'>';
    s += restrictions[rest];
    s += '</'+rest+'>';    
  };

  s += '</RestrictionList>';
  s += '</Restrictions>';

  // Properties
  s += '<Properties>';
  s += '<PropertyList>';

  for(var prop in properties) {
    s += '<'+prop+'>';
    s += properties[prop];
    s += '</'+prop+'>';    
  }

  s += '</PropertyList>';
  s += ' </Properties>';
  s += '</Discover>';

  POST(this.url, SOAPEnvelope(s), async, function(data){
		//var res = unpack();
		// call cb
    var res = xmlparse(data);
    res = rsparse(res);
    //console.log();
		if(cb) cb(res);		
	});
	// Send http request
	// unpack result
};


XMLAClient.prototype.execute = function(command, properties, cb) {
/*
<Execute>
   <Command>...</Command>
   <Properties>...</Properties>
   <Parameters>...</Parameters>
</Execute>
*/


	// Pack
	// Send http request
	// unpack result
	//var res = unpack();
	// call cb
	if(cb) cb(res);
};

/** Discover Aliases */

/*
XMLAClient.prototype.datasources = XMLAClient.prototype.discover_datasources = function(restrictions, properties, async, cb) {
	this.discover('DISCOVER_DATASOURCES', restrictions, properties, async, cb);
};

XMLAClient.prototype.properties = XMLAClient.prototype.discover_properties = function(restrictions, properties, async, cb) {
  this.discover('DISCOVER_PROPERTIES', restrictions, properties, async, cb);
};

XMLAClient.prototype.schema_rowsets = XMLAClient.prototype.discover_schema_rowsets = function(restrictions, properties, async, cb) {
  this.discover('DISCOVER_SCHEMA_ROWSETS', restrictions, properties, async, cb);
};

XMLAClient.prototype.enumerators = XMLAClient.prototype.discover_enumerators = function(restrictions, properties, async, cb) {
  this.discover('DISCOVER_ENUMERATORS', restrictions, properties, async, cb);
};

XMLAClient.prototype.keywords = XMLAClient.prototype.discover_keywords = function(restrictions, properties, async, cb) {
  this.discover('DISCOVER_KEYWORDS', restrictions, properties, async, cb);
};

XMLAClient.prototype.literals = XMLAClient.prototype.discover_literals = function(restrictions, properties, async, cb) {
  this.discover('DISCOVER_LITERALS', restrictions, properties, async, cb);
};

XMLAClient.prototype.cubes = XMLAClient.prototype.mdschema_cubes = function(restrictions, properties, async, cb) {
  this.discover('MDSCHEMA_CUBES', restrictions, properties, async, cb);
};
*/
var keywords = {
  discover_datasources: "DISCOVER_DATASOURCES",
  discover_properties: "DISCOVER_PROPERTIES",
  discover_schema_rowsets: "DISCOVER_SCHEMA_ROWSETS",
  enumerators: "DISCOVER_ENUMERATORS",
  jeywords: "DISCOVER_KEYWORDS",
  literals: "DISCOVER_LITERALS",
  dbschema_catalogs: "DBSCHEMA_CATALOGS",
  columns: "DBSCHEMA_COLUMNS",
  types: "DBSCHEMA_PROVIDER_TYPES",
  tables: "DBSCHEMA_TABLES",
  info: "DBSCHEMA_TABLES_INFO",
  actions: "MDSCHEMA_ACTIONS",
  mdschema_cubes: "MDSCHEMA_CUBES",
  dimensions: "MDSCHEMA_DIMENSIONS",
  functions: "MDSCHEMA_FUNCTIONS",
  hierarchies: "MDSCHEMA_HIERARCHIES",
  measures: "MDSCHEMA_MEASURES",
  members: "MDSCHEMA_MEMBERS",
  props: "MDSCHEMA_PROPERTIES",
  sets: "MDSCHEMA_SETS",
};

for(var k in keywords) {
  XMLAClient.prototype[k] = new Function("restrictions, properties, async, cb",
    'return this.discover("'+keywords[k]+'", restrictions, properties, async, cb);'
  );
};


/**
  Get the list of datasources from XMLA source
*/
XMLAClient.prototype.datasources = function(cb) {
  this.discover_datasources(function(data){
//    console.log(data);
    var sources = [];
    var data1 = data.root.children;
    //console.log(data1);
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        //console.log(data2);
        var data2 = data1[k].children[0].children[0].children[0];

        for(var i=1;i<data2.children.length;i++) {
          var source = {};
          var d = data2.children[i].children;
          for(var j=0;j<d.length;j++) {
            if(d[j].name == 'ProviderType') {
              if(typeof source.ProviderType === 'undefined') source.ProviderType = [];
              source.ProviderType.push(d[j].content);
            } else {
              source[d[j].name] = d[j].content;
            }
          }
          sources.push(source);
        };


      }
    };
    cb(sources);    
  });
};


XMLAClient.prototype.properties = function(cb){
  this.discover_0roperties(function(data){
    var properties = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
    for(var i=1;i<data2.length;i++) {
      var property = {};
      var d = data2[i].children;
      for(var j=0;j<d.length;j++) {
        property[d[j].name] = d[j].content;
      }
      properties.push(property);
    }
      }
    }
    cb(properties);
  });
};


XMLAClient.prototype.rowsets = function(cb){
  this.discover_schema_rowsets(function(data){
    var properties = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
    for(var i=1;i<data2.length;i++) {
      var property = {};
      var d = data2[i].children;
      for(var j=0;j<d.length;j++) {
        property[d[j].name] = d[j].content;
      }
      properties.push(property);
    }
      }
    }
    cb(properties);
  });
};


XMLAClient.prototype.catalogs = function(cb){
  this.dbschema_catalogs(function(data){
    var properties = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
    for(var i=1;i<data2.length;i++) {
      var property = {};
      var d = data2[i].children;
      for(var j=0;j<d.length;j++) {
        property[d[j].name] = d[j].content;
      }
      properties.push(property);
    }
      }
    }
    cb(properties);
  });
};

XMLAClient.prototype.cubes = function(cb){
  this.mdschema_cubes(function(data){
    var properties = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
    for(var i=1;i<data2.length;i++) {
      var property = {};
      var d = data2[i].children;
      for(var j=0;j<d.length;j++) {
        property[d[j].name] = d[j].content;
      }
      properties.push(property);
    }
      }
    }
    cb(properties);
  });
};

XMLAClient.prototype.properties = function(restrictions,properties,cb){
  this.discover('DISCOVER_PROPERTIES',restrictions,function(data){
    var properties = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
    for(var i=1;i<data2.length;i++) {
      var property = {};
      var d = data2[i].children;
      for(var j=0;j<d.length;j++) {
        property[d[j].name] = d[j].content;
      }
      properties.push(property);
    }
      }
    }
    cb(properties);
  });
};

function rsparse (data) {
    var columns = [], ixcolumns = {};
    var rows = [];
    var data1 = data.root.children;
    for(var k = 0;k<data1.length;k++) {
      if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
        || data1[k].name.toUpperCase() === 'SOAP:BODY') {
        var data2 = data1[k].children[0].children[0].children[0].children;
        

        for(var g=0;g<data2[0].children.length;g++){
          if(data2[0].children[g].name == "xsd:complexType" 
            && data2[0].children[g].attributes.name == 'row'){

            var data3 = data2[0].children[g].children[0].children;
            for(var l=0;l<data3.length;l++) {
              var column = {};
              var data4 = data3[l].attributes;
              for(var m in data4) {
                column[m] = data4[m];
              };
              columns.push(column);
              ixcolumns[column.name] = column;
            }

          }
        };

        for(var i=1;i<data2.length;i++) {
          var row = {};
          var d = data2[i].children;
          for(var j=0;j<d.length;j++) {
            if(ixcolumns[d[j].name].maxOccurs) {
              if(!row[d[j].name]) row[d[j].name] = [];
              row[d[j].name].push(d[j].content);
            } else {
              row[d[j].name] = d[j].content;
            }
          }
          rows.push(row);
        }
      }
    }
    return {columns:columns,rows:rows};
}

XMLAClient.discoverDatasources = function(restrictions, properties, cb) {
  this.discovery('DISCOVER_DATASOURCES',restrictions, properties, cb);
}

