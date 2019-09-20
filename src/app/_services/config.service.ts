import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class ConfigService {
	private config: any;

	constructor(private http: HttpClient) { }
	
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
		this.config = await this.http.get('/json/config').toPromise();
			
		return this.config;
	}
}
