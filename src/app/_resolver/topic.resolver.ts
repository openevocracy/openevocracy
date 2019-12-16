import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { TopicService } from '../_services/topic.service';

import { BasicTopic } from '../_models/topic/basic';

@Injectable()
export class TopicResolver implements Resolve<BasicTopic> {
	constructor(private topicService: TopicService) {}
	
	public resolve(route: ActivatedRouteSnapshot) {
		// Manage topic and loads some basic shared information about topic
		return this.topicService.getBasicTopicAsync(route.params.id);
	}
}
