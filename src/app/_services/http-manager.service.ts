import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Http, Response, Headers, RequestOptions, ResponseContentType } from '@angular/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../_services/alert.service';
import { ConfigService } from '../_services/config.service';

import 'rxjs/add/observable/throw';
import * as _ from 'underscore';

@Injectable()
export class HttpManagerService {
	private cfg: any;

	constructor(
		private http: Http,
		private router: Router,
		private alert: AlertService,
		private translate: TranslateService,
		private configService: ConfigService) {
			this.cfg = configService.get();
		}
		
	private getOptions() {
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
		return this.http.get(url, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public getFile(url) {
		var options = this.getOptions();
		options.responseType = ResponseContentType.ArrayBuffer;
		return this.http.get(url, options)
			.map(res => {
				var body = res['_body'];
				var blob = new Blob([body], {type: 'application/pdf'});
				return blob;
			})
			.catch(error => { return this.handleError(error); })
			.subscribe(blob => {
				var url = window.URL.createObjectURL(blob);
				window.open(url);
			});
	}
	
	public post(url, body) {
		return this.http.post(url, body, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public put(url, body) {
		return this.http.put(url, body, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public delete(url) {
		return this.http.delete(url, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public patch(url, body) {
		return this.http.patch(url, body, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public extractData(res: Response) {
		let body = res.json();
		if(this.cfg.DEBUG)
			console.log('http response', body);
		return body || { };
	}
	
	public handleError(raw: Response | any) {
		if(this.cfg.DEBUG)
			console.error(raw);
		// If server sends 401 'Unauthorized'
		if(_.has(raw, 'status') && raw.status == 401 && raw._body == 'Unauthorized') {
			// Delete token in local storage and redirect
			window.localStorage.removeItem('currentUser');
			this.router.navigate(['/login']);
			
			return Observable.throw(raw);
		}
		
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
