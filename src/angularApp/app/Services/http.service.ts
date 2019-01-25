import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import Response from '@Interfaces/response';
import {retry, catchError} from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ConfigService } from '@Services/config.service';

@Injectable({
	providedIn: 'root'
})
export class HTTPService {
  
  constructor(private http: HttpClient, private config: ConfigService) { }

  private static isFile(file : any) : boolean{
  	return file != null && (file instanceof Blob || file instanceof File || (file.flashId && file.name && file.size));
  }

  private static addValueToFormData(formData : FormData, key : string, value : any) : boolean{
    let returnFormData = false;
  	if( HTTPService.isFile(value) ){
  		returnFormData = true;
  		formData.append(key, value, value.name);
  	}else if(Array.isArray(value)){
  		for(let kkey in value){
  			let j = HTTPService.addValueToFormData(formData, key, value[kkey]);
  			if(j && !returnFormData)
  				returnFormData = j;
  		}
  	}else if(typeof value === "object"){
  		for(let kkey in value){
  			let j = HTTPService.addValueToFormData(formData, key+"."+kkey, value[kkey]);
  			if(j && !returnFormData)
  				returnFormData = j;
  		}
  	}else
  		formData.append(key, value);
  	return returnFormData;
  }

  private makeOptions(config : { [propName: string]: any }, query : object = {}, data : object = {}) : object{
    const headers = config.headers || {};
    const options = {...config};

    if(Object.keys(query).length > 0){
      const params = new HttpParams();
      for(const key in query)
        params.set(key, query[key]);
      options.params = params;
    }

    if(Object.keys(data).length > 0){
      const jsonBody = {...data};
      const formDataBody : FormData = new FormData();
      let isFormData : boolean = false;
      for(const key in data){
    		isFormData = HTTPService.addValueToFormData(formDataBody, key, data[key]);
    	}
      headers['Content-Type'] = isFormData ? 'multipart/form-data;charset=utf-8' : 'application/json;charset=utf-8';
      options.body = isFormData ? formDataBody : JSON.stringify(jsonBody);
    }

    for(let key in headers){
      const H = new HttpHeaders();
      for(const key in headers){
        H.set(key, headers[key]);
      }
      options.headers = H;
    }

    options.reportProgress = true;
    return options;
  }

  private handleError(error : HttpErrorResponse){
      if (error.error instanceof ErrorEvent) {
        console.error('An error occurred:', error.error.message);
      } else {
        console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${error.error}`);
      }

      const r : Response = {
        success: false
      };

      return throwError(r);
  }

  private doRequest<T extends Response>(method: string, url: string = '', query: object = {}, body: object = {}, config: object = {}){
    const options = this.makeOptions(config, query, body);
    return this.http.request<T>(method, `${this.config.API}${url}`, options)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  get<T extends Response>(url: string = '', query: object = {}, config: object = {}){
    return this.doRequest<T>("GET", url, query, {}, config);
  }

  delete<T extends Response>(url: string = '', query: object = {}, config: object = {}){
    return this.doRequest<T>("DELETE", url, query, {}, config);
  }

  post<T extends Response>(url: string = '', data: object = {}, query: object = {}, config: object = {}){
    return this.doRequest<T>("POST", url, query, data, config);
  }

  put<T extends Response>(url: string = '', data: object = {}, query: object = {}, config: object = {}){
    return this.doRequest<T>("PUT", url, query, data, config);
  }

}
