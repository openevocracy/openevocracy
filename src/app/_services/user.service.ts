import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { baseURL } from '../_shared/config';

import { TokenService } from './token.service';

class Credentials {
	email: string;
	password: string;
}

@Injectable()
export class UserService {
	private userId: string;

	constructor(
		private http: Http,
		private tokenService: TokenService) {
	}
	
	public authenticate(credentials): Observable<Credentials> {
		let self = this;
		
		return this.http.post(baseURL + 'json/auth/login', credentials)
			.map(function (res) {
				console.log('res', res.json());
				
				this.userId = res.json() && res.json().id;
				
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
		console.log(credentials);
		
		return this.http.post(baseURL + 'json/auth/register', credentials)
			.map(function (res) {
				let token = res.json() && res.json().token;
				this.userId = res.json() && res.json().id;
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
		return this.http.post(baseURL + 'json/auth/logout', this.userId)
			.map(function (res) {
				console.log('succesfully logged out');
			})
			.catch(error => {
				console.warn(error);
				var errorMessage = JSON.parse(error._body);
				return Observable.throw(errorMessage);
			});
			
		// clear userId
		//delete this.userId;
	}

}
