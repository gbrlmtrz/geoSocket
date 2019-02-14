'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["incall"],
	properties: {
		incall: {
			type: "boolean"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	publish : true
}; 