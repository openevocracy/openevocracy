import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../_services/alert.service';
import { ConfigService } from '../_services/config.service';

import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';

import * as _ from 'underscore';

@Injectable()
export class HttpManagerService {
	private cfg: any;

	constructor(
		private http: HttpClient,
		private router: Router,
		private alert: AlertService,
		private translate: TranslateService,
		private configService: ConfigService) {
			this.cfg = configService.get();
		}
		
	private getOptions() {
		const currentUser = window.localStorage.getItem('currentUser');
		
		if (_.isUndefined(currentUser) || _.isNull(currentUser)) {
			return undefined;
		} else {
			const token = JSON.parse(currentUser).token;
			const headers = new HttpHeaders({ 'Authorization': 'JWT ' + token});
			return { 'headers': headers };
		}
	}
	
	public get(url) {
		return this.http.get(url, this.getOptions())
			.map(res => { return this.extractData(res); })
			.catch(error => { return this.handleError(error); });
	}
	
	public getPdfFile(url) {
		// Get options
		let options = this.getOptions();
	
		// Call http get and return file as blob
		return this.http.get(url, {
			responseType: "blob",
			headers: options.headers.append("Content-Type", "application/json")
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
	
	public extractData(res) {
		if(this.cfg.DEBUG)
			console.log('http response', res);
		return res || { };
	}
	
	public handleError(error) {
		if(this.cfg.DEBUG)
			console.error(error);
		// If server sends 401 'Unauthorized'
		if(_.has(error, 'status') && error.status == 401 && error.error == 'Unauthorized') {
			// Delete token in local storage and redirect
			window.localStorage.removeItem('currentUser');
			this.router.navigate(['/login']);
			
			return Observable.throw(error);
		}
		
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
