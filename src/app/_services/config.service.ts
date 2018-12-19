import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

//import { HttpManagerService } from './http-manager.service';

@Injectable()
export class ConfigService {
	private config: any;

	constructor(private http: Http) { }
	
	/*
	 * @desc: Get config which was previously loaded from server
	 */
	public get(): any {
		return this.config;
	}
	
	/*
	 * @desc: Loads config variables from server, where the config is stored in a config file
	 */
	async load(): Promise<any> {
		// Make it a promise: it will be called only once while runtime
		//this.config = await this.httpManagerService.get('config').toPromise();
		this.config = await this.http.get('/json/config')
			.map(res => { return res.json(); })
			.catch(error => { return error.json(); })
			.toPromise();
			
		return this.config;
	}
}
