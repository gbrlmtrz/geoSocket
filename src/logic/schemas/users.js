const transformer = require('./_transformer');
const objectCopy  = require("fast-copy").default;

const EntitySchema = {
	_id: {
		type: "string",
		_$filter: "objectid",
		_$label: "id",
		_$displayAs: "text"
	},
	name: {
		type: "string",
		_$insertable: true,
		_$selfupdateable: true,
		_$updateable: true,
		_$searchable: true,
		_$insertRequired: "nameRequired"
	},
	handle: {
		type: "string",
		toLowerCase: true,
		minLength : 3,
		_$index: 1,
		_$unique: "handleAlreadyRegistered",
		_$insertable: true,
		_$selfupdateable: true,
		_$updateable: true,
		_$searchable: true,
		_$insertRequired: "handleRequired"
	},
	mail: {
		type: "string",
		toLowerCase: true,
		minLength : 3,
		_$filter: "email",
		_$index: 1,
		_$unique: "mailAlreadyRegistered",
		_$insertable: true,
		_$selfupdateable: true,
		_$updateable: true,
		_$searchable: true,
		_$insertRequired: "mailRequired"
	},
	password: {
		type: "string",
		_$pattern: /(?:(\S+\s){3}(\S+\s?){1,})/,
		_$private: true,
		_$insertable: true,
		_$updateable: true,
		_$selfupdateable: true,
		_$insertRequired: "passwordRequired"
	},
	priv: {
		type: "number",
		minimum: 1,
		maximum: 2,
		default: 2,
		_$insertable: true,
		_$updateable: true,
		_$searchable: true,
		_$insertRequired: "privRequired"
	},
	lastOnline: {
		type: "integer",
		_$filter: "date"
	},
	lastUpdate: {
		type: "integer",
		_$filter: "date"
	},
	issuedAfter: {
		type: "integer",
		_$filter: "date"
	},
	created: {
		type: "integer",
		_$filter: "date"
	},
	valid: {
		type: "boolean",
		_$updateable: true,
		_$searchable: true
	},
	enabled: {
		type: "boolean",
		_$updateable: true,
		_$searchable: true
	}
};

const InsertSchema = transformer.create(objectCopy(EntitySchema));
const UpdateSchema = transformer.update(objectCopy(EntitySchema));
const UpdateSelfSchema = transformer.updateSelf(objectCopy(EntitySchema));
const RemoveSchema = transformer.remove(objectCopy(EntitySchema));
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
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/id/:id",
		method: "GET",
		schema: objectCopy(GetSchema),
		entityFuntion: "MakeSelectOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/id/:id",
		method: "PUT",
		schema: objectCopy(UpdateSchema),
		entityFuntion: "MakeUpdateOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/id/:id",
		method: "DELETE",
		schema: objectCopy(RemoveSchema),
		entityFuntion: "MakeRemoveOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/",
		method: "POST",
		schema: objectCopy(InsertSchema),
		entityFuntion: "MakeInsertOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/",
		method: "PUT",
		schema: objectCopy(UpdateSelfSchema),
		entityFuntion: "MakeUpdateOneSelf",
		privs: [
			{
				method: "isLogged",
				messageKey: "youMustLogIn"
			}
		]
	},
	{
		url: "/",
		method: "GET",
		schema: objectCopy(GetSchema),
		entityFuntion: "MakeSelectOneSelf",
		privs: [
			{
				method: "isLogged",
				messageKey: "youMustLogIn"
			}
		]
	},
];

module.exports = {
	routes,
	EntitySchema : objectCopy(EntitySchema)
};