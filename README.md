# OLAP.js

JavaScript Online Analytical Processing server and library for browser and Node.js

(c) 2015 [Andrey Gershun](agershun@gmail.com), [Mathias Rangel Wulff](https://twitter.com/rangelwulff)

**Work in progress!**






## Express OLAP server

```js
    var olap = require('olap');
    olap.xmla();
    olap.execute(mdx);
```

## XMLA Interface

```js
	var res = olap.xmla(xmla);
```
Here olap.js returns XML data with result.

## JSON Interface

Discover cubes
```js
	var res = olap.cubes();
```

Discover measures from the cube:
```js
	var res = olap.measures(cube);
```

Discover measure members:
```js
	var res = olap.levelmember(cube,measure);
```

Execute MDX query:
```js
    var res = olap.mdx(mdx);
```

## Cube description




