import { Injectable } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { MatSnackBar } from '@angular/material';

import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { HttpManagerService } from './http-manager.service';

import * as _ from 'underscore';

@Injectable()
export class LanguageService {

	constructor(
		private snackBar: MatSnackBar,
		private translateService: TranslateService,
		private httpManagerService: HttpManagerService,
		private userService: UserService,
		private utilsService: UtilsService) {}
		
	private getUid() {
		return this.userService.getUserId();
	}
	
	// desc: Initializes translation after startup
	public initializeTranslation() {
		// This language will be used as a fallback when a translation isn't found in the current language
		this.translateService.setDefaultLang('en');
		
		// Take lang from local storage, otherwise take browser lang
		// If browser lang is not available, it will fall back to default lang
		let key = localStorage.getItem('language') || this.utilsService.getBrowserLanguage();
		this.translateService.use(key);
	}
	
	// @desc: Set language by lang key, done after user interaction
	public setLanguage(key) {
		// Update language
		this.translateService.use(key);
		// Set/Update language in local storage for later use
		localStorage.setItem('language', key);
		// Update user language to server
		this.httpManagerService.post('/json/user/lang', {'uid': this.getUid(), 'lang': key}).subscribe(res => {
			forkJoin(
				this.translateService.get(res.alert.content),
				this.translateService.get('FORM_BUTTON_CLOSE'))
			.subscribe(([msg, action]) => {
				let snackBarRef = this.snackBar.open(msg, action, {
					'duration': 5000
				});
			});
		});
	}
	
	/*
	 * @desc: Get language from server and update client language
	 * They should ideally already be the same
	 */
	public setClientLanguage() {
		this.httpManagerService.get('/json/user/lang/' + this.getUid())
			.subscribe(res => {
				// Update language
				this.translateService.use(res.lang);
				// Update language in local storage for later use
				localStorage.setItem('language', res.lang);
		});
	}
}
