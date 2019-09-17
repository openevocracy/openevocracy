import { Injectable, EventEmitter } from '@angular/core';

import { UserService } from './user.service';

import * as parseUrl from 'url-parse';
import * as origin from 'get-location-origin';

@Injectable()
export class ConnectionAliveService {
	
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

	/**
	 * @desc: Initializes socket connection to server, the job is to regularily
	 *        do ping pong and check if connection is still available
	 */
	public init() {
		const parsed = parseUrl(origin);
		const protocol = parsed.protocol.includes('https') ? 'wss://' : 'ws://';
		this.aliveSocket = new WebSocket(protocol + parsed.host + '/socket/alive/'+this.userToken);
		
		this.aliveSocket.onopen = function(event) {
			console.log('connected');
			
			// If connection was broken before and is reconnected now
			if (!this.isAlive) {
				// Set isAlive true again and stop retry interval, since it was successful
				this.isAlive = true;
				//clearInterval(this.retryInterval);
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
		
		// WebSocket connection was closed from server
		this.aliveSocket.onclose = function(e) {
			console.log('onclose');
			// Disable connection, when socket is closed
			this.disableConnection();
		}.bind(this);
	}
	
	/**
	 * @desc: Starts a ping interval and disables connection if it is lost
	 */
	public startPingInterval() {
		this.pingInterval = setInterval(() => {
			if (!this.isAlive) {
				// If server does not respond anymore, disable connection
				this.disableConnection();
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
		clearInterval(this.pingInterval);
		// Trigger offline event if was connected before
		if (this.isConnected) {
			// Wait one second to avoid visual effects when just reloading (F5) the tab
			setTimeout(() => {
				this.connectionLost.emit(true);
			}, 1000);
		}
		// Set flags to disconnected
		this.isAlive = false;
		this.isConnected = false;
		// Retry connection
		this.startRetryTimeout();
	}
	
	/**
	 * @desc: When connection is lost, after some time, try to reconnect
	 *        and initialize the websocket again
	 */
	public startRetryTimeout() {
		// Wait 1 seconds and retry connection
		this.retryTimeout = setTimeout(() => {
			this.init();
		}, 1000);
	}

}
