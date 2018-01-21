import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { TopicListElement } from '../_models/topic-list-element';
import { baseURL } from '../_shared/config';

import { HttpManagerService } from './http-manager.service';

import { UserService } from './user.service';

import 'rxjs/add/operator/catch';

@Injectable()
export class TopicsListService {
	
	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService,
		private userService: UserService) { }
				
	getTopicsList(): Observable<TopicListElement[]> {
		let headers = new Headers({ 'Authorization': 'JWT ' + this.userService.getToken() });
        let options = new RequestOptions({ headers: headers });
        console.log(options);
		
		return this.http.get(baseURL + 'json/topics', options)
		   .map(res => { return this.httpManagerService.extractData(res); })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}
}
