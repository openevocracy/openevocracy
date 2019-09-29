import { Injectable, EventEmitter, OnDestroy } from '@angular/core';

import { UserService } from './user.service';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

@Injectable()
export class ConnectionAliveService implements OnDestroy {
	
	// Define global variables
	public isConnectionAssumed:boolean = true;
	public isConnected:boolean = true;
	public aliveSocket;
	public pingTimeout;
	public userToken;
	public pingInterval;
	public retryTimeout;
	
	// Define connection events
	public connectionLost = new EventEmitter();
	public connectionReconnected = new EventEmitter();

	constructor(
		private userService: UserService
	) {
		// Get user token from user service
		this.userToken = this.userService.getToken();
	}
	
	/*
	 * @desc: Lifecylce hook, used to close socket connection properly if depending components are destroyed
	 */
	ngOnDestroy() {
		// Stop ping interval
		if (this.pingInterval)
			clearInterval(this.pingInterval);
		
		// Close pad socket
		if (this.aliveSocket)
			this.aliveSocket.close();
	}

	/**
	 * @desc: Initializes socket connection to server, the job is to regularily
	 *        do ping pong and check if connection is still available
	 */
	public init() {
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.aliveSocket = new WebSocket(protocol + parsed.host + '/socket/alive/' + this.userToken);
		
		this.aliveSocket.onopen = (event) => {
			// If connection was broken before and is reconnected now
			if (!this.isConnectionAssumed) {
				// Set isConnectionAssumed and isConnected to true again
				this.isConnectionAssumed = true;
				this.isConnected = true;
				// Emit reconnection event
				this.connectionReconnected.emit(true);
			}
			
			// Init ping interval
			this.startPingInterval();
		};
		
		// A message from the server
		this.aliveSocket.onmessage = (event) => {
			// Parse message from server
			const msg = event.data
			
			// If pong arrives, connection is still alive
			if (msg == 'pong')
				this.isConnectionAssumed = true;
		};
		
		this.aliveSocket.onerror = (err) => {
			//console.log('onerror', err);
		};
		
		// WebSocket connection was closed from server
		this.aliveSocket.onclose = (event) => {
			//console.log('onclose', event);
			// Disable connection and retry
			this.disconnectAndRetry();
		};
	}
	
	/**
	 * @desc: Starts a ping interval and disables connection if it is lost
	 */
	public startPingInterval() {
		this.pingInterval = setInterval(() => {
			if (!this.isConnectionAssumed && this.isConnected) {
				// If server does not respond anymore, disable connection and retry
				this.disconnectAndRetry();
			}
			
			// Assume connection as interrupted until receiving pong
			this.isConnectionAssumed = false;
			// Send ping to server, which requests for pong
			this.aliveSocket.send('ping');
		}, 15000);
	}
	
	/**
	 * @desc: Disables connections, which means that the ping interval is stopped and
	 *        an event for disconnect is triggert to inform the system about a disconnect.
	 *        Also try to reconnect to the server.
	 */
	public disconnectAndRetry() {
		// Stop interval
		clearInterval(this.pingInterval);
		
		// Wait 500 ms to avoid visual effects when reloading (F5) the tab
		setTimeout(() => {
			// Trigger offline event if was connected before
			if (this.isConnected)
				this.connectionLost.emit(true);
			
			// Set flags to disconnected
			this.isConnectionAssumed = false;
			this.isConnected = false;
			
			// Retry connection
			this.startRetryTimeout();
		}, 500);
	}
	
	/**
	 * @desc: When connection is lost, after some time, try to reconnect
	 *        and initialize the websocket again
	 */
	public startRetryTimeout() {
		// Wait 5 seconds and retry connection
		this.retryTimeout = setTimeout(() => {
			// If is normally not necessary since retry timeout is only called when connection is closed
			// it's here for safety, in order to really avoid double connections
			if(!this.isConnected)
				this.init();
		}, 5000);
	}
}
