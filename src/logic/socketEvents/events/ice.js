'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["ice", "to"],
	properties: {
		ice: {
			type: ["string", "object"],
			additionalProperties: {},
			properties: {}
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