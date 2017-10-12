import { RouterLinkActive } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { AppComponent } from '../app.component';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	constructor(public app: AppComponent) { }
	
	ngOnInit() {
	}
	
	setLanguage(key) {
		this.app.setLanguage(key);
	}
}
