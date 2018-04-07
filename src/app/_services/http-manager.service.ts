import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { cfg } from '../../../shared/config';

import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { TokenService } from './token.service';

import 'rxjs/add/observable/throw';
import * as _ from 'underscore';

@Injectable()
export class HttpManagerService {

	constructor(
		private http: Http,
		private tokenService: TokenService,
		private alert: AlertService,
		private translate: TranslateService) { }
		
	private getOptions() {
		let token = this.tokenService.getToken();
		
		if (_.isUndefined(token) || _.isNull(token)) {
			return null;
		} else {
			let headers = new Headers({ 'Authorization': 'JWT ' + token});
			let options = new RequestOptions({ headers: headers });
			return options;
		}
	}
	
	public get(url) {
		return this.http.get(cfg.BASE_URL + url, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public post(url, body) {
		return this.http.post(cfg.BASE_URL + url, body, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public put(url, body) {
		return this.http.put(cfg.BASE_URL + url, body, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public delete(url) {
		return this.http.delete(cfg.BASE_URL + url, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public patch(url, body) {
		return this.http.patch(cfg.BASE_URL + url, body, this.getOptions())
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
		
		// Show alert component if alert object is part of the server response
		var self = this;
		var res = error.json();
		if(_.has(res, 'alert')) {
			// First clear old alerts
			self.alert.clear();
			
			// Push new alert
			this.translate.get(res.alert.content, res.alert.vars).subscribe(str => {
				self.alert.alert(res.alert.type, str);
			});
		}
		
		return Observable.throw(errMsg);
	}

}
