import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { cfg } from '../../../shared/config';

import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';

import 'rxjs/add/observable/throw';
import * as _ from 'underscore';

@Injectable()
export class HttpManagerService {

	constructor(
		private http: Http,
		private alert: AlertService,
		private translate: TranslateService) { }
		
	private getOptions() {
		// Move to user service?
		
		var currentUser = window.localStorage.getItem('currentUser');
		
		if (_.isUndefined(currentUser) || _.isNull(currentUser)) {
			return null;
		} else {
			var token = JSON.parse(currentUser).token;
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
	
	public handleError(raw: Response | any) {
		var error = raw.json();
		
		// Show alert component if alert object is part of the server response
		var self = this;
		if(_.has(error, 'alert')) {
			// First clear old alerts
			self.alert.clear();
			
			// Push new alert
			this.translate.get(error.alert.content, error.alert.vars).subscribe(str => {
				self.alert.alert(error.alert.type, str);
			});
		}
		
		return Observable.throw(error);
	}

}
