const transformer = require('./_transformer');

const EntitySchema = {
	_id: {
		type: "string",
		$filter: "uuid",
		_$label: "id",
		_$displayAs: "text",
		mainIndex: true,
	},
	type: {
		type: "string",
		default: "feature"
	},
	channelName: {
		type: "string"
	},
	geometry: {
		type: "object",
		required: ["type", "coordinates"],
		properties: {
			type: {
				type: "string"
			},
			coordinates: {
				type: "array",
				items: {
					type: "number"
				}
			}
		}
	},
	created: {
		type: "integer",
		_$label: "userCreated",
		_$displayAs: "date"
	}
};

/*const InsertSchema = transformer.create({...EntitySchema});
const UpdateSchema = transformer.update({...EntitySchema});
const UpdateSelfSchema = transformer.updateSelf({...EntitySchema});
const RemoveSchema = transformer.remove({...EntitySchema});*/
const GetSchema = transformer.get({...EntitySchema});
const RetrieveSchema = transformer.retrieve({...EntitySchema});

const routes = [
	{
		url: "/search",
		method: "GET",
		schema: {...RetrieveSchema},
		entityFuntion: "doSelectFull"
	},
	{
		url: "/id/:id",
		method: "GET",
		schema: {...GetSchema},
		entityFuntion: "doSelectOneFull"
	}
];

module.exports = {
	EntitySchema : {...EntitySchema},
	routes,
	/*InsertSchema: {...InsertSchema},
	UpdateSchema: {...UpdateSchema},
	UpdateSelfSchema: {...UpdateSelfSchema},
	RemoveSchema: {...RemoveSchema},*/
	GetSchema: {...GetSchema},
	RetrieveSchema: {...RetrieveSchema}
};