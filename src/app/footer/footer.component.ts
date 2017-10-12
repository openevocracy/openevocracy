import { Component, OnInit } from '@angular/core';

// Read version from package.json file
declare function require(moduleName: string): any;
const { version: version } = require('../../../package.json');


@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: [ './footer.component.scss' ]
})

export class FooterComponent implements OnInit {
	public version;
	
	constructor() {
		this.version = version;
	}
	
	ngOnInit() {}

}
