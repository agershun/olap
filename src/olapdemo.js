function olapdemo(server) {
	server.datasources = {};
	var ds = { 
		DataSourceName: 'ParmesanoDS',
	    DataSourceDescription: 'Parmesano Data Source',
       	URL: 'http://localhost:'+this.port+this.path,
       	DataSourceInfo: 'Parmesano Data Source Info',
       	ProviderName: 'olap.js',
       	ProviderType: ["MDX"],
       	AuthenticationMode: 'Unauthenticated' } 		
	};
	server.datasources[ds.DataSourceName] = ds;
}

exports.demo = olapdemo;