import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Topic } from '../_models/topic/topic';
import { TopicToolbar } from '../_models/topic/toolbar';
import { TopicOverview } from '../_models/topic/overview';

import { HttpManagerService } from './http-manager.service';

//import 'rxjs/add/operator/catch';

@Injectable()
export class TopicService {
	constructor(
		private httpManagerService: HttpManagerService
	) { }
	
	public vote(topicId: string, userId: string) {
		return this.httpManagerService.post('/json/topic-vote', {'topicId': topicId, 'userId': userId});
	}
	
	public unvote(topicId: string, userId: string) {
		return this.httpManagerService.post('/json/topic-unvote', {'topicId': topicId, 'userId': userId});
	}
	
	public addTopic(topicName: string) {
		return this.httpManagerService.post('/json/topic/create', {'name': topicName});
	}
	
	/*public getTopic(topicId): Observable<Topic> {
		return this.httpManagerService.get('/json/topic/' + topicId);
	}*/
	
	public manageTopic(topicId: string): Observable<boolean> {
		return this.httpManagerService.get('/json/topic/manage/' + topicId);
	}
	
	public getTopicToolbar(topicId: string): Observable<TopicToolbar> {
		return this.httpManagerService.get('/json/topic/toolbar/' + topicId);
	}
	
	public getTopicOverview(topicId: string): Observable<TopicOverview> {
		return this.httpManagerService.get('/json/topic/overview/' + topicId);
	}
	
	public downloadResultPdf(topicId: string) {
		this.httpManagerService.getFile('/file/topic/'+topicId);
	}
}
