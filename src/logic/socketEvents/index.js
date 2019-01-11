'use strict';
const {readdirSync} = require("fs");
const eventsF = readdirSync(`${__dirname}/events`);
const events = new Map();
const {addEvent} = require("../socketManager");

for(const event of eventsF){
	const name = event.slice(0, -3);
	events.set(name, require(`${__dirname}/events/${name}`));
}

const setUpEvents = function(){
	events.forEach((value, key) => {
		addEvent(key, value);
	});
};

module.exports = setUpEvents;