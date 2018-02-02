import { Injectable } from '@angular/core';

@Injectable()
export class TokenService {
	private token: string;
	
	constructor() { 
		var currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
		this.token = currentUser && currentUser.token;
	}
	
	public setToken(email, _token) {
		// store jwt token in local storage to keep user logged in between page refreshes
		window.localStorage.setItem('currentUser', JSON.stringify({ 'email': email, 'token': _token }));
		
		this.token = _token;
	}
	
	public removeToken() {
		// remove jwt token from local storage
		window.localStorage.removeItem('currentUser');
		
		delete this.token;
	}
	
	public getToken() {
		return this.token;
	}
	
	public isToken() {
		if(this.token)
			return true
		else
			return false
	}
}
