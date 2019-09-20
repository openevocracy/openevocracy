import { Injectable, EventEmitter, OnDestroy } from '@angular/core';

import { UserService } from './user.service';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

@Injectable()
export class ConnectionAliveService implements OnDestroy {
	
	// Define global variables
	public isAlive:boolean = true;
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
		// Close pad socket
		if (this.aliveSocket)
			this.aliveSocket.close();
		
		// Stop ping interval
		if (this.pingInterval)
			clearInterval(this.pingInterval);
	}

	/**
	 * @desc: Initializes socket connection to server, the job is to regularily
	 *        do ping pong and check if connection is still available
	 */
	public init() {
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.aliveSocket = new WebSocket(protocol + parsed.host + '/socket/alive/' + this.userToken);
		
		this.aliveSocket.onopen = function(event) {
			// If connection was broken before and is reconnected now
			if (!this.isAlive) {
				console.log('onopen reconnect');
				// Set isAlive and isConnected to true again
				this.isAlive = true;
				this.isConnected = true;
				// Emit reconnection event
				this.connectionReconnected.emit(true);
			}
			
			// Init ping interval
			this.startPingInterval();
		}.bind(this);
		
		// A message from the server
		this.aliveSocket.onmessage = function (e) {
			// Parse message from server
			const msg = e.data
			
			// If pong arrives, connection is still alive
			if (msg == 'pong') {
				console.log('pong');
				this.isAlive = true;
			}
		}.bind(this);
		
		this.aliveSocket.onerror = function (err) {
			console.log(err);
		};
		
		// WebSocket connection was closed from server
		this.aliveSocket.onclose = function(e) {
			console.log('onclose');
			// Disable connection, when socket is closed
			if (this.isConnected)
				this.disableConnection();
		}.bind(this);
	}
	
	/**
	 * @desc: Starts a ping interval and disables connection if it is lost
	 */
	public startPingInterval() {
		this.pingInterval = setInterval(() => {
			console.log('interval');
			if (!this.isAlive && this.isConnected) {
				console.log('connection lost');
				// If server does not respond anymore, disable connection
				//this.disableConnection();
				// Close socket
				this.aliveSocket.close();
			}
			
			// Set isAlive to false and ping server again
			this.isAlive = false;
			this.aliveSocket.send('ping');
			// If the server responds within 30 seconds, the isAlive status is reset to true
		}, 30000);
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
		
		// Wait 500 ms to avoid visual effects when reloading (F5) the tab
		setTimeout(() => {
			console.log('emit event, connected false');
			// Trigger offline event if was connected before
			if (this.isConnected)
				this.connectionLost.emit(true);
			
			// Set flags to disconnected
			this.isAlive = false;
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
		// Wait 1 seconds and retry connection
		this.retryTimeout = setTimeout(() => {
			console.log('retry');
			this.init();
		}, 5000);
	}

}
