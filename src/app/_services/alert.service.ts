import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'underscore';

import { Alert, AlertType } from '../_models/alert';

@Injectable()
export class AlertService {
	private subject = new Subject<Alert>();
	private keepAfterRouteChange = false;

	constructor(
		private router: Router,
		private translate: TranslateService) {
		// clear alert messages on route change unless 'keepAfterRouteChange' flag is true
		router.events.subscribe(event => {
			if (event instanceof NavigationStart) {
				if (this.keepAfterRouteChange) {
					// only keep for a single route change
					this.keepAfterRouteChange = false;
				} else {
					// clear alert messages
					this.clear();
				}
			}
		});
	}
	
	private setAlert(type: AlertType, message: string, keepAfterRouteChange = false) {
		this.keepAfterRouteChange = keepAfterRouteChange;
		this.subject.next(<Alert>{ type: type, message: message });
	}
	
	public getAlert(): Observable<any> {
		return this.subject.asObservable();
	}
	
	public success(message: string, keepAfterRouteChange = false) {
		this.setAlert(AlertType.Success, message, keepAfterRouteChange);
	}
	
	public error(message: string, keepAfterRouteChange = false) {
		this.setAlert(AlertType.Error, message, keepAfterRouteChange);
	}
	
	public info(message: string, keepAfterRouteChange = false) {
		this.setAlert(AlertType.Info, message, keepAfterRouteChange);
	}
	
	public warn(message: string, keepAfterRouteChange = false) {
		this.setAlert(AlertType.Warning, message, keepAfterRouteChange);
	}
	
	public alert(type: string, message: string, keepAfterRouteChange = false) {
		
		switch(type) {
			case "danger": { this.error(message); break; }
			case "success": { this.success(message); break; }
			case "warning": { this.warn(message); break; }
			default: { this.info(message); break; }
		}
	}
	
	public clear() {
		// Clear alerts (transmit empty alert clears alerts)
		this.subject.next();
	}

}
