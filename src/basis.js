

var Server = function(){};
var Property = function(){};
var DataSource = function(){};
var Catalog = function(){};
var Cube = function(){};
var DimensionGroup = function(){};
var Dimension = function(){};
var Hierarchy = function(){};
var Measure = function(){};
var KPI = function(){};
var Level = function(){};
var Member = function(){};


// Examples

var Server = function() {
	this.property = {};
	this.dataSource = {};
};


/** @class Property */
var Property = function(prop){
	this.PropertyName = prop.PropertyName;
	this.PropertyDescription = prop.PropertyDescription;
	this.PropertyType = prop.PropertyType;
	this.PropertyAccessType = prop.PropertyAccessType;
	this.IsRequired = prop.IsRequired;
	this.Value = prop.Value;
}

/** Create property 
	@function
*/
Server.prototype.addProperty = function(prop) {
	this.property[prop.PropertyName] = new Property(prop);
};


Server.prototype.initProperties = function() {

	srv.addProperty({
	 	PropertyName:'DbpropMsmdSubqueries',
		PropertyDescription:'DbpropMsmdSubqueries',
		PropertyType:'int',
		PropertyAccessType:'ReadWrite',
		IsRequired:false,
		Value:0
	});

};

Server.prototype.defineProperty(properties = function(){
	var a = [];
	for(var k in property) {
		a.push(this.property[k]);
	}
	return a;
};


Server.prototype.init = function(){
	this.initProperties();
};


Server.prototype.initDemo() = {
	var ds = this.addDataSource('ParmesanoDS');
	var cat = ds.addCatalog('ParmesanoCatalog');
	var cube = cat.addCube('ParmesanoCube');
	var md = cube.addDimension('Measures');
	md.addMeasure('qty');
};

cube.dimensions.forEach();
cube.dimension.Measure

xmla.cube.dimensions = getDimensions(); if(!this.dmiensionsLoaded) dimensions = detDimensions();

var client = xmla.client('http://localhost:3000/xmla');
console.log(client.cubes);

client.datasource.ParmesanoDS.catalog.ParmesanoCatalog.cube.ParmesanoCube.CubeDescription
server.datasource.ParmesanoDS.catalog.ParmesanoCatalog.cube.ParmesanoCube.CubeDescription

if(!this.dimensionsCached) 



