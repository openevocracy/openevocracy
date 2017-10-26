import { Injectable } from '@angular/core';

@Injectable()
export class UserService {
	private login: boolean;

	constructor() {
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

}
