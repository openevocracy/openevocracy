import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

export class Thread {
	/* Raw values from database */
	threadId: string;
	mainPostId: string;
	title: string;
	html: string;
	forumId: string;
	authorId: string;
	citationId: string;
	closed: boolean;
	private: boolean;
	
	/* Calculated values */
	createdTimestamp: number;
	
	constructor(res: any) {
		this.threadId = res._id;
		this.mainPostId = res.mainPostId;
		this.title = res.title;
		this.html = res.html;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.citationId = res.citationId;
		this.closed = res.closed;
		this.private = res.private;
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
