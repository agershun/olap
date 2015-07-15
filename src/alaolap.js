/**
	Stand-alone OLAP server based on OLAP.js
*/

// Require block
var olap = require('./../dist/olap.js');

// Create and run the server
var srv = olap.server(3000);

/** @todo Add parameters with port, olap definition file, and other stuff */

