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
	
	constructor(private translate: TranslateService) {
		this.initializeTranslation();
	}
	
	private initializeTranslation() {
		// This language will be used as a fallback when a translation isn't found in the current language
		this.translate.setDefaultLang('en');
		
		// Have a look if language is already stored in local storage
		let languageKey = localStorage.getItem('language');
		
		if(languageKey !== null) {
			this.translate.use(languageKey);
		} else {
			// The lang to use, if the lang isn't available, ask for browser language
			let browserLangRaw = navigator.language || navigator['userLanguage'];
			let browserLang = browserLangRaw.split('-')[0];
			this.translate.use(browserLang);
		}
	}
}
