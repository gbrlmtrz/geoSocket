'use strict';
const payload = {
	type: "object",
	additionalProperties: false,
	required: ["istyping"],
	properties: {
		istyping: {
			type: "boolean"
		}
	}
};

const schema = require("../payloadWrapper")(payload);


module.exports = {
	schema,
	publish : true
}; 