'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["nudge", "to"],
	properties: {
		nudge: {
			type: "string"
		},
		to: {
			type: "string"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: false,
	toOne : true
};