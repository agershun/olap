
// XML/A client
var xmla = require('./olap/xmla.js');
var olap = require('./olap/olap.js');

var srv1 = olap.server({port:3000});
var srv2 = olap.server({port:4000, passthru:'http://localhost:8080/mondrian-embedded/xmla'});
var srv3 = olap.server({port:5000, passthru:'http://sampledata.infragistics.com/olap/msmdpump.dll'});

var cli1 = xmla.client('http://localhost:3000/xmla');
var cli2 = xmla.client('http://localhost:4000/xmla');
var cli3 = xmla.client('http://sampledata.infragistics.com/olap/msmdpump.dll');


// cli2.execute('SELECT {[Measures].[qty]} ON COLUMNS FROM deptqty',
// 	{Catalog:'FoodMart',Format:'Multidimensional'},function(err,rs){
// 	console.log(rs);
// });



//cli3.discoverDBCatalogs();


//cli3.discoverDBCatalogs(function(err,rs){ console.log('var columns =',rs.columns);
//	console.log('var rows = [', rs.rows[0],'];'); });

// srv2.execute('SELECT [qty] FROM Foodmart',{Format:'Multidimensional'},function(err,data){
// 	console.log(data);
// });


/*

http://jsfiddle.net/akoku0zg/

DBSCHEMA_CATALOGS
MDSCHEMA_CUBES
MDSCHEMA_MEASURES
MDSCHEMA_KPIS
MDSCHEMA_DIMENSIONS
MDSCHEMA_HIERARCHIES
MDSCHEMA_LEVELS
MDSCHEMA_MEASUREGROUP_DIMENSIONS

*/


// cli2.execute('SELECT {[Measures].[qty]} ON COLUMNS FROM deptqty',{Catalog:'FoodMart'},function(err,rs){
// 	console.log(rs);
// });

// cli1.execute('SELECT {[Measures].[qty]} ON COLUMNS FROM deptqty',{Catalog:'Parmesano'},function(err,rs){
// 	console.log(rs);
// });


// cli1.discoverDataSources(function(err,rs){
// 	console.log(rs);
// });

// cli0.discoverDatasources(function(rs){
// 	console.log(rs);
// });

//cli0.discover('DISCOVER_PROPERTIES',function(rs){
//	console.log(rs);
//});


/*
cli1.datasources(function(data){
	console.log(data);
});
*/

/*
cli2.datasources(function(data){
	console.log(data);
});
*/

// cli3.datasources(function(data){
// 	console.log(data);
// });

//cli2.properties({PropertyName:'Catalog'},{},function(data){
//	console.log(data);
//});






// cli3.properties(function(data){
//     var properties = [];
//     var data1 = data.root.children;
//     for(var k = 0;k<data1.length;k++) {
//       if(data1[k].name.toUpperCase() === 'SOAP-ENV:BODY' 
//         || data1[k].name.toUpperCase() === 'SOAP:BODY') {
//         var data2 = data1[k].children[0].children[0].children[0].children;
// 		for(var i=0;i<data2.length;i++) {
// 			var property = {};
// 			var d = data2[i].children;
// 			for(var j=0;j<d.length;j++) {
// 				property[d[j].name] = d[j].content;
// 			}
// 			properties.push(property);
// 		}
//       }
//     }
//     console.log(properties);
// });



//console.log(6,cli);


//cli.datasources(function(data) {
//	console.log(data);
	// body...
//});

/*

cli.dbschema_catalogs(function(data){
	console.log(data);
});



cli.discover_properties(params, function(err, data){
	console.log(err,data);
});

cli.mdschema_catalogs(function(err, data){
	console.log(err,data);
});

cli.mdschema_cubes({catalog:'Adventure Works DW'}, function(err, data){
	console.log(err,data);
});
*/

