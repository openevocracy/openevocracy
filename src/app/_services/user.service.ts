import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { HttpManagerService } from './http-manager.service';
import { TokenService } from './token.service';

import { cfg } from '../../../shared/config';

class Credentials {
	email: string;
	password: string;
}

@Injectable()
export class UserService {
	private userId: string;

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService,
		private tokenService: TokenService) {
	}
	
	public getUserId() {
		return this.userId;
	}
	
	public authenticate(credentials): Observable<Credentials> {
		let self = this;
		
		return this.http.post(cfg.BASE_URL + '/json/auth/login', credentials)
			.map(function (res) {
				// Set user ID
				self.userId = res.json() && res.json().id;
				
				// Store token
				let token = res.json() && res.json().token;
				if (token) {
					// set token property
					self.tokenService.setToken(credentials.email, token);
					
					// return true to indicate successful login
					return true;
				} else {
					// return false to indicate failed login
					console.log('failed');
					return false;
				}
			})
			.catch(error => {
				console.warn(error);
				var errorMessage = JSON.parse(error._body);
				return Observable.throw(errorMessage);
			});
	}
	
	public register(credentials): Observable<Credentials> {
		let self = this;
		
		return this.http.post(cfg.BASE_URL + '/json/auth/register', credentials)
			.map(res => {
				let token = res.json() && res.json().token;
				self.userId = res.json() && res.json().id;
				if (token) {
					// set token property
					self.tokenService.setToken(credentials.email, token);
					
					// return true to indicate successful registration
					return true;
				} else {
					// return false to indicate failed registration
					console.log('failed');
					return false;
				}
			})
			.catch(error => {
				console.warn(error);
				var errorMessage = JSON.parse(error._body);
				return Observable.throw(errorMessage);
			});
	}
	
	public logout() {
		// Remove token from local storage
		this.tokenService.removeToken();
		
		// Post logout, authentication needed
		return this.httpManagerService.post('/json/auth/logout', { 'uid': this.userId });
	}

}
