import { Component } from '@angular/core';
import { LanguageService } from './_services/language.service';

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	host: {'[class.loading]':'loading'}
})

export class AppComponent {
	// Remove loading class from body
	private loading: boolean = false;
	
	constructor(private languageService: LanguageService) {
		languageService.initializeTranslation();
	}
}
