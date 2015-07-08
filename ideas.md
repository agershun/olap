# Olap.js Ideas

Installation:
```bash
	> npm install olap
```

Run stand-alone server:
```bash
	> olap
```

Create stand-alone server in Node.js:

```js
	var olap = require('olap');
	olap.server({port:3000, xmla:'/xmla'});
```

Embed server into Express framework with standard path ('/xmla'):

```js
	var express = require('express');
	var app = express();
	var olap = require('olap');

	app.use(olap.express());
```

Embed server into Express framework with non-standard paths:
```
	app.get('/discover',function(req,res){
		res.send(olap.discover());
	});
```js

or
```js
	app.use(olap.express({xmla:'/xmla1'}));
```

### Server entry points:

XML/A:
```js
	olap.xmla(xmla);
	// returns XML formed answer
```

Simple JSON interface:
```js
	olap.discover(parms);
	// returns array of cubes
	olap.execute(mdx_statement,params);
	// returns recordset object
	olap.ToXML(recordset);
	// returns XML object for XML/A answer
```

Also there are some functions for creation and modification of:
* datasources
* schemas
* cubes
* dimensions
* measures

### How the server works

1. Client (e.g. MS Excel or HTML pivot control) sends XML/A request. Usually, the client
sends some DISCOVERY queries, and then one EXECUTE query. This is a POST message with 
XML/A text in the body (for Execute query it includes MDX statement inside).

2. Server catch the path, unpack XML/A query and run ```olap.xmla()```

3. This function check the type of query, and if it is DISCOVERY then it runs ```olap.discovery()``` method, and ```olap.execute()``` in opposite case.

4. ```olap.discovery()``` returns information about cudes, measures, etc.

5. ```olap.execute() parses MDX statement to AST (abstract syntax tree).

then it calls ```olap.query(mdx_ast)``` function.

6. ```olap.query()``` translate MDX to the set of SQL statements and run them (this is the most intelligent part of the server). Some SQL queries can be cached in the memory,

7. After SQL queries Olap.js will run post processing (this operation can be paralleled with
intelligent map-reduce algorithm). Here Olap.js will make all aggregations.

8. The result set is packed into JSON and then can be packed into XML envelope and return to the client.

### MDX Parser

We will use the similar parser from AlaSQL and AlaMDX.

### Data Sources

We will use stadard connectors to Postgres, MySQL, SQLite, and MS SQL Server. We will also 
use AlaSQL for fast tests and simple debugging.

* Postgres - https://github.com/brianc/node-postgres
* MySQL - https://github.com/felixge/node-mysql/
* SQLite - https://github.com/mapbox/node-sqlite3

### Olap Processor

The most intelligent part of the system. 

The first queries request for Dimensions. After that Olap.js will construct query for 
Measures and groupping data. After that Olap.js will postprocess data (construct rows and
columns queries).

### Cube Editor

Olap.js will save data about cubes, dimensions and measures in JSON format and saves it
to the disk. Later we will create visual editor (like SSAS and Mondrian do).


