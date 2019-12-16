import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { BasicTopic } from '../_models/topic/basic';
import { Topic } from '../_models/topic/topic';
import { TopicToolbar } from '../_models/topic/toolbar';
import { TopicOverview } from '../_models/topic/overview';

import { HttpManagerService } from './http-manager.service';

import * as _ from 'underscore';

@Injectable()
export class TopicService {
	
	public topics: BasicTopic[] = [];
	
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
	
	/*public getBasicTopicAsync(topicId: string): Observable<BasicTopic> {
		return this.httpManagerService.get('/json/topic/manage/' + topicId);
	}*/
	
	public getTopicToolbar(topicId: string): Observable<TopicToolbar> {
		return this.httpManagerService.get('/json/topic/toolbar/' + topicId);
	}
	
	public getTopicOverview(topicId: string): Observable<TopicOverview> {
		return this.httpManagerService.get('/json/topic/overview/' + topicId);
	}
	
	public downloadResultPdf(topicId: string) {
		this.httpManagerService.getFile('/file/topic/'+topicId);
	}
	
	public addProposal(topicId: string, userId: string) {
		const data = { 'topicId': topicId, 'userId': userId };
		return this.httpManagerService.post('/json/topic/proposal/create', data);
	}
	
	public setTopicHasProposal(topicId: string, hasProposal: boolean) {
		let basicTopic = this.getBasicTopicFromList(topicId);
		basicTopic.hasProposal = hasProposal;
	}
	
	public setTopicStage(topicId: string, stage: number) {
		let basicTopic = this.getBasicTopicFromList(topicId);
		basicTopic.stage = stage;
	}
	
	/**
	 * @desc: Gets basic topic from list
	 */
	public getBasicTopicFromList(topicId: string): BasicTopic {
		return _.findWhere(this.topics, { 'topicId': topicId });
	}
	
	/**
	 * @desc: Gets basic information about topic from server and write them to list
	 */
	public getBasicTopicAsync(topicId: string): Observable<BasicTopic> {
		// Create Observable, such that subscribe can be used, after this function was called
		return Observable.create((observer: Observer<BasicTopic>) => {
			
			return this.httpManagerService.get('/json/topic/basic/' + topicId).subscribe((topic) => {
				
				// Try to get topic from list
				let topicFromList = this.getBasicTopicFromList(topicId);
				
				if (topicFromList) {
					// If topic is already in list, update it
					topicFromList = new BasicTopic(topic);
				} else {
					// If topic is not in list, add it
					this.topics.push(new BasicTopic(topic));
				}
				
				// Hand over to next subscription
				observer.next(topic);
				observer.complete();
			});
		});
	}
}
