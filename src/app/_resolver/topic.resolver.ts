import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { TopicService } from '../_services/topic.service';

@Injectable()
export class TopicResolver implements Resolve<boolean> {
	constructor(private topicService: TopicService) {}
	
	public resolve(route: ActivatedRouteSnapshot) {
		// Manage topic, before loading contents
		return this.topicService.manageTopic(route.params.id);
	}
}
