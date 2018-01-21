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
	//private login: boolean;
	private token: string;

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) {
			
		var currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.token = currentUser && currentUser.token;
			
		// Check if user data is stored in browser and set login status
		/*if(localStorage.getItem('login') === null)
			this.login = false;
		else
			this.login = true;*/
	}
	
	public setLoginStatus(status: boolean) {
		// Set login status depending on parameter
		//this.login = status;
		
		// Store log in status in browser
		/*if(status)
			localStorage.setItem('login', 'logged in');
		else
			localStorage.removeItem('login');*/
	}
	
	/*public getLoginStatus() {
		// Return login status, stored in variable
		return this.login;
	}*/
	
	public setToken(token) {
		this.token = token;
	}
	
	public getToken() {
		return this.token;
	}
	
	public authenticate(credentials): Observable<Credentials> {
		let self = this;
		
		return this.http.post(baseURL + 'json/auth/login', credentials)
		   .map(function (res) {
		   		let token = res.json() && res.json().token;
                if (token) {
                    // set token property
                    self.setToken(token);

                    // store username and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify({ 'email': credentials.email, 'token': token }));
                    
                    console.log(token);

                    // return true to indicate successful login
                    return true;
                } else {
                    // return false to indicate failed login
                    return false;
                }
		   })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}

}
