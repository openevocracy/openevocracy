import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { UtilsService } from './utils.service';
import { HttpManagerService } from './http-manager.service';

import 'rxjs/add/operator/map';

import * as _ from 'underscore';

class Credentials {
	email: string;
	password: string;
}

@Injectable()
export class UserService {

	constructor(
		private http: HttpClient,
		private router: Router,
		private utilsService: UtilsService,
		private httpManagerService: HttpManagerService) {}
	
	public getUserId() {
		return this.getUser().uid;
	}
	
	public getToken() {
		return this.getUser().token;
	}
	
	public hasToken() {
		if(_.has(this.getUser(), 'token'))
			return true
		else
			return false
	}
	
	public setUser(uid, token) {
		var _user = { 'uid': uid, 'token': token };
		
		// Store user (including jwt token) in local storage to keep user logged in between page refreshes
		window.localStorage.setItem('currentUser', JSON.stringify(_user));
	}
	
	public getUser() {
		return JSON.parse(window.localStorage.getItem('currentUser'));
		//return this.user;
	}
	
	public removeUser() {
		// Remove user from local storage
		window.localStorage.removeItem('currentUser');
	}
	
	public authenticate(credentials) {
		let self = this;
		return this.http.post('/json/auth/login', credentials).map((res) => {
			// Set ID and store token
			self.setUser(res['id'], res['token']);
			
			// Redirect to front page
			self.router.navigate(['/']);
			
			return true;
		}).
		catch(error => {
			return self.httpManagerService.handleError(error);
		});
	}
	
	public register(credentials) {
		let langKey = this.utilsService.getBrowserLanguage();
		let user = _.extend(credentials, {'lang': langKey});
		return this.httpManagerService.post('/json/auth/register', user);
	}
	
	public sendVerificationMailAgain(email) {
		return this.httpManagerService.post('/json/auth/verification', {'email': email});
	}
	
	public sendNewPassword(email) {
		return this.httpManagerService.post('/json/auth/password', {'email': email});
	}
	
	public logout() {
		var self = this;
		
		// Post logout, authentication needed
		this.httpManagerService.post('/json/auth/logout', {'uid': this.getUserId()}).subscribe(res => {
			// Remove token from local storage
			self.removeUser();
			
			// Redirect to any page after logout was successful
			self.router.navigate(['/login']);
		});
	}
	
	public verifyEmail(uid) {
		return this.httpManagerService.post('/json/auth/verifyEmail', {'uid': uid});
	}

}
