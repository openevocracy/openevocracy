import { Component, OnInit } from '@angular/core';

import { ConfigService } from '../../_services/config.service';

// Read version from package.json file
declare function require(moduleName: string): any;
const { version: version } = require('../../../../package.json');


@Component({
	selector: 'app-footer',
	templateUrl: './footer.component.html',
	styleUrls: [ './footer.component.scss' ]
})

export class FooterComponent implements OnInit {
	public version;
	public debug;
	
	constructor(private configService: ConfigService) {
		const cfg = configService.get();
		
		this.version = version;
		this.debug = cfg.DEBUG;
	}
	
	ngOnInit() {}

}
