'use strict';
const config = require('config');
const Redis = require('ioredis');
const object = {
	port: config.get("redis.port"),	// Redis port
	host: config.get("redis.host"),	// Redis host
	family: 4						// 4 (IPv4) or 6 (IPv6)
};

const eventCounts = {};
const redisInstances = {};

console.log(config);

module.exports = {
	getRedis: function(intention){
		if(intention){
			if(!redisInstances.hasOwnProperty(intention)){
				redisInstances[intention] = new Redis(object);
			}
			return redisInstances[intention];
		}
		return new Redis(object);
	},
	getChannelKey: function(patterns, channel){
		let counter = 0, pattern;
		
		for(const ptr of patterns){
			if(channel.match(ptr)){
				pattern = ptr;
				break;
			}
		}
		
		if(eventCounts.hasOwnProperty(pattern))
			counter = eventCounts[pattern];
		else{
			const min = pattern.length;
			for(let i = 0; i < min; i++)
			{
			   if(pattern.charAt(i) === channel.charAt(i))
				  counter++;
				else
					break;
			}
		}
		
		return {channel: pattern, key: channel.substr(counter)};
	}
};