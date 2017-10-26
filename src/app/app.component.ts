import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	host: {'[class.loading]':'loading'}
})

export class AppComponent {
	// Remove loading class from body
	private loading: boolean = false;
	
	constructor(public translate: TranslateService) {
		// This language will be used as a fallback when a translation isn't found in the current language
		translate.setDefaultLang('en');
		
		// Have a look if language is already stored in local storage
		let languageKey = localStorage.getItem('language');
		
		if(languageKey !== null) {
			translate.use(languageKey);
		} else {
			// The lang to use, if the lang isn't available, it will use the current loader to get them
			translate.use('en');
		}
	}
	
	setLanguage(key) {
		// Set language
		this.translate.use(key);
		// Store language in local storage for later use
		localStorage.setItem('language', key);
	}
}
