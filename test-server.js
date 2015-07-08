
// OLAP part
var olap = require('./olap/olap.js');
olap.server(3000);

// XML/A part
var xmla = require('./xmla/xmla.js');
var x = xmla('localhost:3000/xmla');

x.discover.properties(function(err, data){
	console.log(err,data);
});
