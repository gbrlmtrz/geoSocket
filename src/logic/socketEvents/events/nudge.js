'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["name"],
	properties: {
		nudge: {
			type: "string"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	echo: false,
	publish: true
};