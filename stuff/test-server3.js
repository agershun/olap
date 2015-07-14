
// XML/A client
var xmla = require('./olap/xmla.js');
var olap = require('./olap/olap.js');

var srv = olap.server({port:3000, passthru:'http://bi.syncfusion.com/olap/msmdpump.dll'});

 var cli0 = xmla.client('http://localhost:3000/xmla');
// var cli1 = xmla.client('http://bi.syncfusion.com/olap/msmdpump.dll');
// var cli2 = xmla.client('http://sampledata.infragistics.com/olap/msmdpump.dll');

//var cli3 = xmla.client('http://localhost:8080/mondrian-embedded/xmla');

cli0.execute('SELECT {[Measures].[qty]} ON COLUMNS FROM deptqty ',
 	{ 	
 		DataSourceInfo:"Provider=Mondrian;DataSource=MondrianFoodMart;",
		Catalog:"FoodMart"
  	},
	function(rs){
		console.log(rs.rows[0][rs.columns[0].name]);
});

// cli2.discover1('DISCOVER_DATASOURCES',{},{},function(rs){
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

