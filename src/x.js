/**
	Explore XML element
	@usage
	    x(xml, path)
	    x(data.root, "Envelope/Body/Discovery")
*/
function x(a,b){
	var bb = b.split('/');
	var an;
	for(var k=0;k<bb.length;k++) {		
		if(typeof a === 'undefined') return undefined;
		if(typeof a.children === 'undefined') return undefined;
		var found = false;
		for(var i=0;i<a.children.length;i++) {
			if(typeof a.children[i] === 'undefined') continue;
			var name = a.children[i].name; 
			if(name.split(':').length > 1) name = name.split(':')[1];
			if(typeof name === 'undefined') continue;
			if(bb[k] === name) {
				found = true;
				an = a.children[i];
				break;
			};
		}
		if(!found) {
			return undefined;
		} else if(k<bb.length) {
			a = an;
		}
	}
	return a;
};

exports.x = x;