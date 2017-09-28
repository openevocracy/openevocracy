import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { Topics } from '../shared/topics';
import { baseURL } from '../shared/config';

import { HttpManagerService } from './http-manager.service';

import 'rxjs/add/operator/catch';

@Injectable()
export class TopicsService {
	
	constructor(private http: Http,
				private httpManagerService: HttpManagerService) { }
				
	/*getTopics(): Observable<Topics> () {
		return this.http.get(baseURL + 'topics')
				   .map(res => { return this.HttpManagerService.extractData(res); })
				   .catch(error => { return this.HttpManagerService.handleError(error); });
	}*/
}
