
// OLAP server
var olap = require('./olap/olap.js');

// Server without server
var srv1 = olap.server();
srv1.discover_properties(params, function(err, data){
	console.log(err,data);
});


// Server with server
var srv2 = olap.server({port:3000});
srv2.discover_properties(params, function(err, data){
	console.log(err,data);
});


// XML/A client
var xmla = require('./olap/xmla.js');
var cli = xmla.client('localhost:3000/xmla');

cli.discover_properties(params, function(err, data){
	console.log(err,data);
});


cli.mdschema_catalogs(function(err, data){
	console.log(err,data);
});

cli.mdschema_cubes({catalog:'Adventure Works DW'}, function(err, data){
	console.log(err,data);
});

cli.discover('MDSCHEMA_CUBES',{catalog:'Adventure Works DW'}, function(err,data){});


