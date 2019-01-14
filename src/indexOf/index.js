const deepEqual = require('deep-equal');
const traditionals = ["boolean", "number", "string"];

module.exports = function indexOf(array, member, fromIndex) {
	if(array===null||array===undefined)
		throw TypeError("Array.prototype.indexOf called on null or undefined");

	let that = Object(array), Len = that.length >>> 0, i = Math.min(fromIndex | 0, Len);
	
	if (i < 0) i = Math.max(0, Len+i); else if (i >= Len) return -1;

	if(member===void 0){
		for(; i !== Len; ++i) 
			if(that[i] === void 0 && i in that) 
				return i; // undefined
	}else if(member !== member){   
		for(; i !== Len; ++i) 
			if(that[i] !== that[i]) 
				return i; // NaN
	}else{  
		const type = typeof(member);
		const isArray = Array.isArray(member);
		if(traditionals.indexOf(type) > -1){
			for(; i !== Len; ++i) 
				if(that[i] === member) 
					return i; // all else
		}else{
			for(; i !== Len; ++i){
				if(isArray && Array.isArray(that[i])){
					if(deepEqual(member, that[i])) return i;
				}
			}	
		}
	}
	return -1; // if the value was not found, then return -1
};