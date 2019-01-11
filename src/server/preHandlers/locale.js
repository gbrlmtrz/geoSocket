const Lang = require('../../logic/Entities/_Lang');
	
const middleWare = function(req, res, next){
	const lang = (req.query.$lang || "es").toLowerCase()
	
	Lang.getLang(lang)
	.then( (l) => { req.lang = l; next();} )
	.catch( (e) => { next(); } );
};

module.exports = middleWare;