/**
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
  var x = require('./x.js').x;

};

// function GET(path,cb){
//     var xhr = new XMLHttpRequest();
//     xhr.onreadystatechange = function() {
//         if (xhr.readyState === XMLHttpRequest.DONE) {
//             if (xhr.status === 200) {
//                 if (cb){
//                     cb(cutbom(xhr.responseText));
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
  this.Format = 'Tabular'; // Default format

//  this.properties = {Format:'Tabular'};

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
  var url = this.url;
  if(typeof requestType === 'object') {
    url = requestType.url || this.url;
    restrictions = requestType.restrictions;
    properties = requestType.properties;
    async = requestType.async;
    cb = requestType.cb;
    requestType = requestType.requestType;
  } else if(typeof restrictions === 'function') {
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

  // if(this.properties) {
  //   properties = extend(extend({},this.properties),properties);
  // };
  if(typeof properties === 'undefined') properties = {};
  if(!properties.Format) properties.Format = this.Format;

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

  POST(url, SOAPEnvelope(s), async, function(err,data){
    if(err) {
      cb(err);
      return;
    }
		//var res = unpack();
		// call cb
    var res = xmlparse(data);

    res = rsparse(res,function(err,rs){
      cb(err,rs);
    });
    //console.log();
//		cb(undefined,res);		
	});
	// Send http request
	// unpack result
};





XMLAClient.prototype.execute = function(command, properties, parameters, async, cb) {
/*
<Execute>
   <Command>...</Command>
   <Properties>...</Properties>
   <Parameters>...</Parameters>
</Execute>
*/
  var url = this.url;
  if(typeof command === 'object') {
    url = command.url || this.url;
    properties = command.properties;
    parameters = command.parameters;
    async = command.async;
    cb = command.cb;
    command = command.command;
  } else if(typeof properties === 'function') {
    cb = properties;
    properties = undefined;
    parameters = undefined;
    async = true;
  } else if(typeof parameters === 'function') {;
    cb = parameters;
    parameters = undefined;
    async = true;
  } else if(typeof async === 'function') {;
    cb = async;
    async = true;
  };

  // if(this.properties) {
  //   properties = extend(extend({},this.properties),properties);
  // }

  if(typeof properties === 'undefined') properties = {};
  if(!properties.Format) properties.Format = this.Format;
//console.log(260,properties);
  var s = '<Execute xmlns="urn:schemas-microsoft-com:xml-analysis"';
  s += ' SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
  
  // Request type
  s += '<Command><Statement>'+command+'</Statement></Command>';
  
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


  // Restrictions
  s += '<Parameters>';

  for(var param in parameters) {
    s += '<Parameter>';
    s += '<Name>';
    s += param;
    s += '</Name>';
    s += '<Value>';
    s += parameters[param];
    s += '</Value>';
    s += '</Parameter>';    
  };

  s += '</Parameters>';

  s += '</Execute>';

//console.log(SOAPEnvelope(s));
  POST(url, SOAPEnvelope(s), async, function(err,data){
    if(err) {
      cb(err);
      return;
    }
    //var res = unpack();
    // call cb
//    console.log(data);

    var res = xmlparse(data);
//    console.log(res.root.children);
    res = rsparse(res,function(err,rs){
      cb(err,rs);
    });
    //console.log();
//    cb(undefined,res);   
  });
  // Send http request
  // unpack result
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

/*
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
/*
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
*/
function rsparse (data,cb) {

    if(x(data.root,'Body/Fault')) {

        console.log(x(data.root,'Body/Fault/faultstring').content);

//console.log(x(data.root,'Body/Fault/detail/error/desc').content);
        if(x(data.root,'Body/Fault/detail/error/desc')) {
          console.log(x(data.root,'Body/Fault/detail/error/desc').content);
        };
        cb(x(data.root,'Body/Fault/faultstring').content);
        return;
    };


//console.log(x(data.root,"Body/ExecuteResponse/return/root/OlapInfo/AxesInfo"));
    if(x(data.root,"Body/ExecuteResponse/return/root/OlapInfo")) {
      //console.log(x(data.root,"Body/ExecuteResponse/return/root/OlapInfo"));
      var cubeInfo = x(data.root,"Body/ExecuteResponse/return/root/OlapInfo/CubeInfo/Cube");
      var cube = cubeInfo.name;

      var axesInfo = x(data.root,"Body/ExecuteResponse/return/root/OlapInfo/AxesInfo");
      var axis = [];
      for(var i=0;i<axesInfo.children.length;i++) {
//        console.log();
        var ai = axesInfo.children[i];
        var axe = {name:ai.attributes.name};
        axis.push(axe);
//        console.log('ai=',x(ai,"HierarchyInfo"));
      }
      
/*
      var cellInfo = x(data.root,"Body/ExecuteResponse/return/root/OlapInfo/CellInfo");
      console.log(x(cellInfo,"Value"));
      console.log(x(cellInfo,"FmtValue"));
      console.log(x(cellInfo,"FormatString"));
*/
      var axs = x(data.root,"Body/ExecuteResponse/return/root/Axes");
//      console.log(axs);
      for(var i=0;i<axs.children.length;i++) {
        var tuples = x(axs.children[i],"Tuples");
        for(var j=0;j<tuples.children.length;j++) {
//          console.log(tuples.children[j]);
        }

      };


      var cellData = x(data.root,"Body/ExecuteResponse/return/root/CellData");
      //console.log(cellData.children);
      var cells = [];
      for(var i=0;i<cellData.children.length;i++) {
        var cell = {};
        cell.Value =x(cellData.children[i],"Value").content; 
        cell.FmtValue =x(cellData.children[i],"FmtValue").content; 
        if(x(cellData.children[i],"FormatString")) {
          cell.FormatString =x(cellData.children[i],"FormatString").content; 
        };
        cells.push(cell);
      };

//      console.log(cube, axis, cells);
      cb(undefined,{cube:cube,axis:axis,cells:cells});
    

    } else {

      var columns = [], ixcolumns = {};
      var rows = [];
      var data1 = data.root.children;
      for(var k = 0;k<data1.length;k++) {
        if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
          || data1[k].name.toUpperCase() === 'SOAP:BODY') {
          if(data1[k].children[0].name.toUpperCase() === "SOAP-ENV:FAULT"){
            console.log(data1[k].children[0].children[3].children[0].children);
            cb('Can\'t parse');
            return;
          };

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
              if(!ixcolumns[d[j].name]) {
                console.log('no column',d[j].name);
                continue;
              }
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
      };
  //    console.log(columns);
      cb(undefined,{columns:columns,rows:rows});
    };
}

XMLAClient.prototype.discoverDataSources = function(restrictions, properties, cb) {
  this.discover('DISCOVER_DATASOURCES',restrictions, properties, cb);
};

XMLAClient.prototype.discoverProperties = function(restrictions, properties, cb) {
  this.discover('DISCOVER_PROPERTIES',restrictions, properties, cb);
};

XMLAClient.prototype.discoverDBCatalogs = function(restrictions, properties, cb) {
  this.discover('DBSCHEMA_CATALOGS',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDCubes = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_CUBES',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDMeasures = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_MEASURES',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDMeasureGroups = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_MEASUREGROUPS',restrictions, properties, cb);
};


XMLAClient.prototype.discoverMDKPIs = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_KPIS',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDDimensions = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_DIMENSIONS',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDHierarchies = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_HIERARCHIES',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDLevels = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_LEVELS',restrictions, properties, cb);
};

XMLAClient.prototype.discoverMDMeasureGroupDimensions = function(restrictions, properties, cb) {
  this.discover('MDSCHEMA_MEASUREGROUP_DIMENSIONS',restrictions, properties, cb);
};
