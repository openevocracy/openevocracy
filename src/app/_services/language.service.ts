import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from './alert.service';
import { UserService } from './user.service';
import { HttpManagerService } from './http-manager.service';

@Injectable()
export class LanguageService {
	
	private uid: string;

	constructor(
		private translateService: TranslateService,
		private httpManagerService: HttpManagerService,
		private userService: UserService,
		private alertService: AlertService) {
		
		this.uid = this.userService.getUserId();
	}
	
	// @desc: Set language by lang key
	public setLanguage(key) {
		// Update language
		this.translateService.use(key);
		// Set/Update language in local storage for later use
		localStorage.setItem('language', key);
		// Update user language to server
		this.httpManagerService.post('/json/user/lang', {'uid': this.uid, 'lang': key})
			.subscribe(res => this.alertService.alertFromServer(res.alert));
	}
	
	// @desc: Get language from server and update client language
	//        They should ideally already be the same
	public setClientLanguage() {
		this.httpManagerService.get('/json/user/lang/' + this.uid)
			.subscribe(res => {
				// Update language
				this.translateService.use(res.lang);
				// Update language in local storage for later use
				localStorage.setItem('language', res.lang);
		});
	}
}
