import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { TopicListElement } from '../_models/topic/topiclist-element';

import { HttpManagerService } from './http-manager.service';

import 'rxjs/add/operator/catch';

@Injectable()
export class TopicsListService {
	
	constructor(
		private httpManagerService: HttpManagerService) { }
		
	getTopicsList(): Observable<TopicListElement[]> {
		return this.httpManagerService.get('/json/topiclist');
	}
}
