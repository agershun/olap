# OLAP.js and XMLA.js API

I developed two libraries:
* XMLA.js - for client access to OLAP cubes via [XMLA](https://en.wikipedia.org/wiki/XML_for_Analysis)
* OLAP.js - prototype of future OLAP server

## XMLA.js

Check out this good introduction to [XML for Analysis communication protocol](https://quartetfs.com/resource-center/xmla-basics) and how to user it with Excel. 

These explanations for Node.js only, but I will add support for browser soon.

Add XMLA.js to the project:
```js
	var xmla = require('xmla.js');
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

Here `rs` is a Recordset with two fields:

* columns - columns of recordset
* rows - rows with columns

To execute MDX operator you can use `execute()` function:
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
	var olap = require('olap.js');
```

Then you can run this server and specify the port:
```js
	var server = olap.server(3000);
	// or
	var server = olap.server({port:3000});
```

You can use exactly the same `discover()` and `execute()` methods
as in XMLA.js.

```js
	server.discovery('DISCOVERY_DATASOURCES',function(rs){
		console.log(rs);
	});
```

### Server pass-thru mode
Currently OLAP.js does not have own database engine and it works
only as pass-thru server to another OLAP server.

To initiate this server you need:
```
	var server = olap.server({port:3000, passthru:'http://localhost:8080/mondrian-embedded/xmla'});
```

After that OLAP.js will pass-thru as discover and execute queries, as well as their results
back to the client.

