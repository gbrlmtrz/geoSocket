class Response{
	constructor(success, response){
		this.success = success;
		if(success){
			if(Array.isArray(response))
				this.items = response;
			else
				this.item = response;
		}else
			this.mes = response;
	} 
} 

module.exports = Response;