'use strict'
const fastparallel = require('fastparallel')
const fastseries = require('fastseries')

function steedz (context) {
	if (!context) {
		context = {}
	}
	
	const _par = fastparallel()
	const _ser = fastseries()
	
	context.parallel = parallel
	context.series = series

	return context

	function parallel (that, funcs) {
		return _handleObjectMap(that, _par, funcs)
	}

	function series (that, funcs) {
		return _handleObjectMap(that, _ser, funcs)
	}
}

function _handleObjectMap (that, iterator, funcs) {
	const keys = Object.keys(funcs);
	return new Promise( (resolve, reject) => {
		iterator(new MapStatus(that, keys, funcs, resolve, reject), callNamedFunc, keys, mapResults); 
	});
}

function MapStatus (that, keys, funcs, resolve, reject) {
	this.resolve = resolve
	this.reject = reject
	this.keys = keys
	this.funcs = funcs
	this.that = that
	this.results = {}
}

function callNamedFunc (key, cb) {
	this.funcs[key].call(this.that, key, cb)
}

function mapResults (err, results) {
	if (err) { return this.reject(err) }

	const keys = this.keys
	const toReturn = {}

	
	for(const i in keys){
		toReturn[keys[i]] = results[i]
	}

	this.resolve(toReturn)
}

module.exports = steedz(steedz)