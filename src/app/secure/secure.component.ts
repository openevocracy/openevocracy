import { Component, OnInit, OnDestroy } from '@angular/core';

import { ConnectionAliveService } from '../_services/connection.service';
import { SnackbarService } from '../_services/snackbar.service';

@Component({
	selector: 'app-secure',
	templateUrl: './secure.component.html',
	styleUrls: ['./secure.component.scss']
})
export class SecureComponent implements OnInit {
	
	public startAliveTimeout;
	public offline: boolean = false;

	constructor(
		private connectionAliveService: ConnectionAliveService,
		private snackbarService: SnackbarService
	) {
		// Start connection alive monitor after 10 seconds
		this.startAliveTimeout = setTimeout(function() {
			this.connectionAliveService.init();
		}.bind(this), 10000);
	}
	
	ngOnInit() {
		// Listen to connection lost event
		this.connectionAliveService.connectionLost.subscribe((res) => {
			// If the user logs in in another browser before the timeout has finished, things go wrong
			// therefore clear timeout to be safe
			clearTimeout(this.startAliveTimeout);
			// Only show visual stuff if reconnect is intended
			if(res.retry) {
				// If connection is lost, lock screen and show snackbar message
				this.offline = true;
				this.snackbarService.showSnackbar('SERVER_CONNECTION_LOST', undefined, 3600*1000);
			}
		});
		
		// Listen to connection reconnected event
		this.connectionAliveService.connectionReconnected.subscribe((res) => {
			// If connection was established agein, unlock screen and show snackbar message
			this.offline = false;
			this.snackbarService.showSnackbar('SERVER_CONNECTED_AGAIN');
		});
	}
	
	ngOnDestroy() {
		// Close socket connection when leaving the component
		this.connectionAliveService.disconnect({ 'retry': false });
	}

}
