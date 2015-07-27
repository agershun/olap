// Test server and client
var olap = require('../src/olap.js');
var server = olap.server({port:3000, demo:true});

console.log(Object.keys(server.datasources));


