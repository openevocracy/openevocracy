import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { Topic } from '../_models/topic';
import { baseURL } from '../_shared/config';

import { HttpManagerService } from './http-manager.service';

//import 'rxjs/add/operator/catch';

@Injectable()
export class TopicService {

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) { }
		
	vote(tid: string) {
		// FIXME: Cookie uid is necessary here!
		//return this.http.post(baseURL + 'json/topic-vote', {'tid': tid});
	}
	
	addTopic(topicName: string) {
		return this.httpManagerService.post(baseURL + 'json/topic', {'name': topicName});
	}
	
	getTopic(tid): Observable<Topic> {
		return this.httpManagerService.get('json/topic/' + tid);
	}

}
