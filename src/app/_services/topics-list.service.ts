import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { TopicListElement } from '../_models/topic-list-element';
import { baseURL } from '../_shared/config';

import { HttpManagerService } from './http-manager.service';

import 'rxjs/add/operator/catch';

@Injectable()
export class TopicsListService {
	
	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) { }
				
	getTopicsList(): Observable<TopicListElement[]> {
		return this.http.get(baseURL + 'json/topics', {withCredentials: true})
		   .map(res => { return this.httpManagerService.extractData(res); })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}
}