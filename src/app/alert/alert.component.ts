// From http://jasonwatmore.com/post/2017/06/25/angular-2-4-alert-toaster-notifications

import { Component, OnInit } from '@angular/core';

import { Alert, AlertType } from '../_models/alert';
import { AlertService } from '../_services/alert.service';
import { ConfigService } from '../_services/config.service';

@Component({
	selector: 'alert',
	templateUrl: './alert.component.html',
	styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
	private cfg: any;
	public alerts: Alert[] = [];
	
	constructor(
		private alertService: AlertService,
		private configService: ConfigService) {
			this.cfg = configService.get();
		}
	
	ngOnInit() {
		this.alertService.getAlert().subscribe((alert: Alert) => {
			if (!alert) {
				// Clear alerts when an empty alert is received
				this.alerts = [];
				return;
			}
			
			// Add alert to array
			this.alerts.push(alert);
			
			// Remove alert automatically after some time
			// FIXME this functionality is buggy
			// If an alert was manually removed, this function removes the next (new) alert after a short time
			// Every alert should have an expiration, if the expiration is acceeded, this particular alert is removed
			// But: maybe not timeout is necessary at all
			/*setTimeout(function(){
				this.alerts.shift();
			}.bind(this), this.cfg.ALERT_REMOVAL_TIME);*/
		});
	}
	
	removeAlert(alert: Alert) {
		this.alerts = this.alerts.filter(x => x !== alert);
	}
	
	cssClass(alert: Alert) {
		if (!alert) {
			return;
		}
		
		// Return css class based on alert type
		switch (alert.type) {
			case AlertType.Success:
				return 'alert alert-success';
			case AlertType.Error:
				return 'alert alert-danger';
			case AlertType.Info:
				return 'alert alert-info';
			case AlertType.Warning:
				return 'alert alert-warning';
		}
	}

}
