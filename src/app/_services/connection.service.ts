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
		console.log('ngOnDestroy');
		
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
			console.log('onopen');
			// If connection was broken before and is reconnected now
			if (!this.isConnectionAssumed) {
				console.log('onopen reconnect');
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
			console.log('onerror', err);
			// Disable connection and retry
			this.disableConnection();
			this.startRetryTimeout();
		};
		
		// WebSocket connection was closed from server
		this.aliveSocket.onclose = (event) => {
			console.log('onclose', event);
		};
	}
	
	/**
	 * @desc: Starts a ping interval and disables connection if it is lost
	 */
	public startPingInterval() {
		this.pingInterval = setInterval(() => {
			if (!this.isConnectionAssumed && this.isConnected) {
				console.log('connection lost');
				// If server does not respond anymore, disable connection
				this.disableConnection();
				// Retry connection
				this.startRetryTimeout();
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
	public disableConnection() {
		// Stop interval
		console.log('stop interval');
		clearInterval(this.pingInterval);
		console.log('interval stopped');
		
		// Wait 500 ms to avoid visual effects when reloading (F5) the tab
		setTimeout(() => {
			console.log('emit event, connected before', this.isConnected);
			// Trigger offline event if was connected before
			if (this.isConnected)
				this.connectionLost.emit(true);
			
			// Set flags to disconnected
			this.isConnectionAssumed = false;
			this.isConnected = false;
		}, 500);
	}
	
	/**
	 * @desc: When connection is lost, after some time, try to reconnect
	 *        and initialize the websocket again
	 */
	public startRetryTimeout() {
		// Wait 5 seconds and retry connection
		this.retryTimeout = setTimeout(() => {
			console.log('retry');
			// If is normally not necessary since retry timeout is only called when connection is closed
			// it's here for safety, in order to really avoid double connections
			if(!this.isConnected)
				this.init();
		}, 5000);
	}

}
