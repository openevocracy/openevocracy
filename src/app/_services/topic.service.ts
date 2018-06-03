import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Topic } from '../_models/topic';
import { cfg } from '../../../shared/config';

import { HttpManagerService } from './http-manager.service';

//import 'rxjs/add/operator/catch';

@Injectable()
export class TopicService {

	constructor(private httpManagerService: HttpManagerService) { }
	
	public vote(topicId: string, userId: string) {
		return this.httpManagerService.post('/json/topic-vote', {'topicId': topicId, 'userId': userId});
	}
	
	public unvote(topicId: string, userId: string) {
		return this.httpManagerService.post('/json/topic-unvote', {'topicId': topicId, 'userId': userId});
	}
	
	public addTopic(topicName: string) {
		return this.httpManagerService.post('/json/topic', {'name': topicName});
	}
	
	public getTopic(tid): Observable<Topic> {
		return this.httpManagerService.get('/json/topic/' + tid);
	}

}
