/**
	The sample server for OLAP.js library.
*/



var olap = require('./olap/olap.js');

// olap.js
// alax.js

// Express
var express = require('express');
var url = require('url');
var app = express();

// Middleware
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());

// XMLA entry point
app.get('/xmla', function (req, res) {
  console.log('XMLA:');
  res.send(olap.xmla(req.body));
});

// Discover Metadata
app.get('/discover/metadata', function (req, res) {
  var query = url.parse(req.url, true).query;
  console.log('Discover metadata cube:',query.cubeName);
  res.send(olap.metadata(query.cubeName));
});

// Discover Level Members
app.get('/discover/levelmembers', function (req, res) {
//  console.log(req);
  res.send(olap.levelmembers(req.body));
});

// Execute
app.post('/execute/execute', urlencodedParser, function (req, res) {
  console.log('Execute MDX:',req.body.mdx);
//  console.log(req.body);
  res.send(olap.execute(req.body));
});

// Server
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});