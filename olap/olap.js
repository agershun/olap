var OLAPServer = new function(params) {

};

OLAPServer.prototype.discover_properties = functon(params, cb) {
	var res = {};
	if(cb) cb(res);
};

exports.server = function(params) {
	return new OLAPServer(params);
};

