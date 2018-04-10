import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { Topic } from '../_models/topic';
import { cfg } from '../../../shared/config';

import { HttpManagerService } from './http-manager.service';

//import 'rxjs/add/operator/catch';

@Injectable()
export class TopicService {

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) { }
	
	vote(tid: string, uid: string) {
		return this.httpManagerService.post('/json/topic-vote', {'tid': tid, 'uid': uid});
	}
	
	unvote(tid: string, uid: string) {
		return this.httpManagerService.post('/json/topic-unvote', {'tid': tid, 'uid': uid});
	}
	
	addTopic(topicName: string) {
		return this.httpManagerService.post('/json/topic', {'name': topicName});
	}
	
	getTopic(tid): Observable<Topic> {
		return this.httpManagerService.get('/json/topic/' + tid);
	}

}
