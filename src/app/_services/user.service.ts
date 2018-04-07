import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

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
		private router: Router,
		private httpManagerService: HttpManagerService,
		private tokenService: TokenService) {
	}
	
	public getUserId() {
		return this.userId;
	}
	
	public setUserId(uid) {
		this.userId = uid;
	}
	
	private setIdAndToken(raw) {
		var res = raw.json();
		
		// Set user ID
		this.userId = res.id;
		
		// Store token
		this.tokenService.setToken(res.email, res.token);
	}
	
	public authenticate(credentials): Observable<boolean> {
		var self = this;
		return this.http.post(cfg.BASE_URL + '/json/auth/login', credentials)
			.map(raw => {
				// Set ID and store token
				self.setIdAndToken(raw);
				
				// Redirect to front page
				self.router.navigate(['/']);
				
				return true;
			}).
			catch(error => {
				return self.httpManagerService.handleError(error);
			});
	}
	
	public register(credentials): Observable<boolean> {
		var self = this;
		return this.http.post(cfg.BASE_URL + '/json/auth/register', credentials)
			.map(raw => {
				// Set ID and store token
				self.setIdAndToken(raw);
				
				return true;
			})
			.catch(error => {
				return self.httpManagerService.handleError(error);
			});
	}
	
	public sendVerificationMailAgain(email) {
		return this.httpManagerService.post('/json/auth/verification', {'email': email});
	}
	
	public logout() {
		var self = this;
		
		// Post logout, authentication needed
		this.httpManagerService.post('/json/auth/logout', { 'uid': this.userId }).subscribe(res => {
			// Remove token from local storage
			self.tokenService.removeToken();
			
			// Redirect to any page after logout was successful
			self.router.navigate(['/login']);
		});
	}

}
