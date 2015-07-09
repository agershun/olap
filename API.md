# OLAP.js and XMLA.js API


I developed two libraries:
* xmla.js - for client access to OLAP cubes via XML/A
* olap.js - prototype of future OLAP server

## xmla.js

THese explanations for Node.js only, but I will add support for browser in
the future.

Add xmla.js to the project:
```js
	var xmla = require('./xmla/xmla.js');
```

Create xmla-client and specify address of OLAP server:
```js
	var client = xmla.client('http://bi.syncfusion.com/olap/msmdpump.dll');
```

Then discover data source:
```js
	client.discover('DISCOVER_DATASCHEMAS',function(rs){
		console.log(rs);
	});
```

Here rs - is a Recordset with two fields:

* columns - columns of recordset
* rows - rows with columns

To execute MDX operator you can use ```execute()``` function:
```
	client.execute('SELECT * FROM Sales',
	 	{ 	
	 		DataSourceInfo:"Provider=Mondrian;DataSource=MondrianFoodMart;",
			Catalog:"FoodMart"
  		},
		function(rs){
			console.log(rs);
		}
	);
```
You need to specify right Catalog name and MDX query.

## OLAP.js

To embed OLAP server into your application you need:
```js
	var olap = require('./olap/olap.js');
```

Then you can run this server and specify the port:
```js
	var server = olap.server(3000);
	// or
	var server = olap.server({port:3000});
```

You can use exactly the same ```discover()``` and ```execute()``` methods
as in ```xmla.js```.
```js
	server.discovery('DISCOVERY_DATASOURCES',function(rs){
		console.log(rs);
	});
```

### Server pass-thru mode
Currently olap.js does not have own database engine and it works
only as pass-thru server to another OLAP server.

To initiate this server you need:
```
	var server = olap.server({port:3000, passthru:'http://localhost:8080/mondrian-embedded/xmla'});
```

After that olap.js will pass-thru as discover and execute queries, as well as their results
back to the client.

