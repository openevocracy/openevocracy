import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { cfg } from '../../../shared/config';

import { TokenService } from './token.service';

import 'rxjs/add/observable/throw';

@Injectable()
export class HttpManagerService {

	constructor(
		private http: Http,
		private tokenService: TokenService) { }
	
	public get(url) {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.tokenService.getToken()});
	   	let options = new RequestOptions({ headers: headers });
	   	
	   	return this.http.get(cfg.baseURL + url, options)
	   		.map(res => { return this.extractData(res); })
			   .catch(error => { return this.handleError(error); });
	}
	
	public post(url, body) {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.tokenService.getToken()});
	   	let options = new RequestOptions({ headers: headers });
	   	
	   	return this.http.post(cfg.baseURL + url, body, options)
	   		.map(res => { return this.extractData(res); })
			   .catch(error => { return this.handleError(error); });
	}
	
	public put(url, body) {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.tokenService.getToken()});
	   	let options = new RequestOptions({ headers: headers });
	   	
	   	return this.http.put(cfg.baseURL + url, body, options)
	   		.map(res => { return this.extractData(res); })
			   .catch(error => { return this.handleError(error); });
	}
	
	public delete(url) {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.tokenService.getToken()});
	   	let options = new RequestOptions({ headers: headers });
	   	
	   	return this.http.delete(cfg.baseURL + url, options)
	   		.map(res => { return this.extractData(res); })
			   .catch(error => { return this.handleError(error); });
	}
	
	public patch(url, body) {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.tokenService.getToken()});
	   	let options = new RequestOptions({ headers: headers });
	   	
	   	return this.http.patch(cfg.baseURL + url, body, options)
	   		.map(res => { return this.extractData(res); })
			   .catch(error => { return this.handleError(error); });
	}
	
	public extractData(res: Response) {
		let body = res.json();
		console.log('http response', body);
		return body || { };
	}
	
	public handleError(error: Response | any) {
		console.log(error);
		
		let errMsg: string;
		if (error instanceof Response) {
			const body = error.json() || '';
			const err = body.error || JSON.stringify(body);
			errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
		} else {
			errMsg = error.message ? error.message : error.toString();
		}
		
		return Observable.throw(errMsg);
	}

}
