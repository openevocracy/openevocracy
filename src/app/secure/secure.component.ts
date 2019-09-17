import { Component, OnInit } from '@angular/core';

import { ConnectionAliveService } from '../_services/connection.service';
import { SnackbarService } from '../_services/snackbar.service';

@Component({
	selector: 'app-secure',
	templateUrl: './secure.component.html',
	styleUrls: ['./secure.component.scss']
})
export class SecureComponent implements OnInit {
	
	public offline: boolean = false;

	constructor(
		private connectionAliveService: ConnectionAliveService,
		private snackbarService: SnackbarService
	) {
		// Start connection alive monitor after 10 seconds
		setTimeout(function() {
			this.connectionAliveService.init();
		}.bind(this), 10000);
	}
	
	ngOnInit() {
		// Listen to connection lost event
		this.connectionAliveService.connectionLost.subscribe((res) => {
			// If connection is lost, lock screen and show snackbar message
			this.offline = true;
			this.snackbarService.showSnackbar('SERVER_CONNECTION_LOST', undefined, 3600*1000);
		});
		
		// Listen to connection reconnected event
		this.connectionAliveService.connectionReconnected.subscribe((res) => {
			// If connection was established agein, unlock screen and show snackbar message
			this.offline = false;
			this.snackbarService.showSnackbar('SERVER_CONNECTED_AGAIN');
		});
	}

}
