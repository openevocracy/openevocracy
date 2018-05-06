import { Component, OnInit } from '@angular/core';
//import { MatToolbarModule, MatListModule, MatMenuModule } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { UserService } from '../_services/user.service';
import { LanguageService } from '../_services/language.service';

import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faCogs } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	private uid: string;
	
	private faGlobe = faGlobe;
	private faCogs = faCogs;
	
	constructor(
		private translateService: TranslateService,
		private userService: UserService,
		private languageService: LanguageService) {
		
		this.uid = this.userService.getUserId();
	}
	
	ngOnInit() {}
	
	private setLanguage(key) {
		this.languageService.setLanguage(key);
	}
	
	private logout() {
		let self = this;
		
		// Call logout function in user service
		this.userService.logout();
	}
}
