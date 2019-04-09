import * as _ from 'underscore';
import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../_services/utils.service";

export class Activity {
	/* An activity related to a specific user, is displayed in list of his/her activities and as notification */
	
	activityId: string; // unique identifier
	userId: string; // identifier of the related user
	type: number; // type of activity (types defined in constants.js)
	targetId: string; // the identifier of another object related to the activity; depends on the type
	timestamp: number; // the timestamp
	
	constructor(res: any) {
		this.activityId = res._id;
		this.userId = res.user;
		this.type = res.type;
		this.targetId = res.targetId;
		this.timestamp = this.getCreationTimestamp(res._id);
	}
	
	private getCreationTimestamp(id) {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(id);
	}
}
