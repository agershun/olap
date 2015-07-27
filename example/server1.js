// Test server and client
var olap = require('../src/olap.js');
var xmla = require('../src/xmla.js');

var client = xmla.client('http://localhost:3000/xmla');

client.discoverDataSources(function(err,rs){
	if(err) {
		console.log(err);
	} else {
		console.log(rs);
	}
});


