const transformer = require('./_transformer');
const objectCopy  = require("fast-copy").default;

const EntitySchema = {
	_id: {
		type: "string",
		_$filter: "objectid",
		_$label: "id",
		_$displayAs: "text"
	},
	channelName: {
		type: "string"
	},
	ips: {
		type: "array",
		_$index: 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$private : true,
		items : {
			type : "string"
		}
	},
	state: {
		type: "object",
		_$insertable : true,
		_$searchable : true,
		required: ["cid"],
		properties: {
			cid: {
				type: "string"
			}
		}
	},
	geometry: {
		type: "object",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$private : true,
		_$index: "2dsphere",
		required: ["type", "coordinates"],
		properties: {
			type: {
				type: "string"
			},
			coordinates: {
				type: "array",
				items: {
					type: "array",
					items: {
						type: "number"
					}					
				}
			}
		}
	},
	created: {
		type: "integer",
		_$filter: "date",
		_$label: "userCreated",
		_$displayAs: "date"
	}
};

const InsertSchema = transformer.create(objectCopy(EntitySchema));
const GetSchema = transformer.get(objectCopy(EntitySchema));
const RetrieveSchema = transformer.retrieve(objectCopy(EntitySchema));

const routes = [
	{
		url: "/search",
		method: "GET",
		schema: objectCopy(RetrieveSchema),
		entityFuntion: "MakeSearch",
		privs: [
			{
				method: "isLogged",
				messageKey: "youMustLogIn"
			}
		]
	},
	{
		url: "/id/:id",
		method: "GET",
		schema: objectCopy(GetSchema),
		entityFuntion: "MakeSelectOne",
		privs: []
	},
	{
		url: "/",
		method: "POST",
		schema: objectCopy(InsertSchema),
		entityFuntion: "MakeInsertOne",
		privs: [
			{
				method: "isLogged",
				messageKey: "youMustLogIn"
			}
		]
	}
];

module.exports = {
	EntitySchema : objectCopy(EntitySchema),
	routes,
	GetSchema: {...GetSchema},
	RetrieveSchema: {...RetrieveSchema}
};