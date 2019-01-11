/*const {getChannelKey, getRedis} = require("./src/redis");
const pub = getRedis("writer");
const sub = getRedis("subscriber");

sub.psubscribe("event_*", "connect_*", "disconnect_*", "split_*", function(err, count){
	if(err) console.log(err);
	console.log("count", count);
	pub.publish("event_1", JSON.stringify({message: "Hello"}));
});

sub.on('pmessage', function(pattern, channel, message){
	console.log(`Recieved ${pattern} ${channel} ${getChannelKey(pattern, channel)}`, JSON.parse(message));
});*/


/*const {findPlaceNearby} = require('./src/logic/channelFinder');

findPlaceNearby(10.415666, -71.455237, 50)
.then( function(places){console.log(places)})
.catch( function(){});*/


const server = require("./src/server");

server.start();

