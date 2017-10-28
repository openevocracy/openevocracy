import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { baseURL } from '../_shared/config'

import { HttpManagerService } from './http-manager.service';

class Credentials {
	email: string;
	password: string;
}

@Injectable()
export class UserService {
	private login: boolean;

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) {
			
		// Check if user data is stored in browser and set login status
		if(localStorage.getItem('login') === null)
			this.login = false;
		else
			this.login = true;
	}
	
	public setLoginStatus(status: boolean) {
		// Set login status depending on parameter
		this.login = status;
		
		// Store log in status in browser
		if(status)
			localStorage.setItem('login', 'logged in');
		else
			localStorage.removeItem('login');
	}
	
	public getLoginStatus() {
		// Return login status, stored in variable
		return this.login;
	}
	
	public authenticate(credentials): Observable<Credentials> {
		return this.http.post(baseURL + 'json/auth/login', credentials)
		   .map(res => { return this.httpManagerService.extractData(res); })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}

}
