
// XML/A client
var xmla = require('./olap/xmla.js');


var cli1 = xmla.client('http://bi.syncfusion.com/olap/msmdpump.dll');

cli1.datasources(function(data){
	console.log(data);
});


var cli2 = xmla.client('http://sampledata.infragistics.com/olap/msmdpump.dll');

cli2.datasources(function(data){
	console.log(data);
});

var cli3 = xmla.client('http://localhost:8080/mondrian-embedded/xmla');

cli3.datasources(function(data){
	console.log(data);
});



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

