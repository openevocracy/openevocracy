import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

export class Thread {
	/* Raw values from database */
	threadId: string;
	mainPostId: string;
	title: string;
	forumId: string;
	authorId: string;
	citationId: string;
	closed: boolean;
	private: boolean;
	views: number;
	postCount: number;
	
	/* Calculated values */
	createdTimestamp: number;
	
	constructor(res: any) {
		this.threadId = res._id;
		this.mainPostId = res.mainPostId;
		this.title = res.title;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.citationId = res.citationId;
		this.closed = res.closed;
		this.private = res.private;
		this.views = res.views;
		this.postCount = res.postCount || 0;
		this.createdTimestamp = this.getCreationTimestamp(res._id);
	}
	
	private getCreationTimestamp(id) {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(id);
	}
}
