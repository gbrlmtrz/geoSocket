'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["to"],
	properties: {
		to: {
			type: "string"
		},
		reason: {
			type: "string"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	toOne : true
};