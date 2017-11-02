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
		// TODO: Create instance of topic and set name
		//let topic = new Topic();
		//topic.name = topicName;
		return this.http.post(baseURL + 'json/topic', {'name': topicName});
	}
	
	getTopic(tid): Observable<Topic> {
		return this.http.get(baseURL + 'json/topic/' + tid, {withCredentials: true})
		   .map(res => { return this.httpManagerService.extractData(res); })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}

}
