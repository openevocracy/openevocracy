import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

export class Comment {
	/* Raw values from database */
	html: string;
	commentId: string;
	postId: string;
	threadId: string;
	forumId: string;
	authorId: string;
	sumVotes: number;
	userVote: number;
	
	/* Calculated values */
	createdTimestamp: number;
	
	constructor(res: any) {
		this.html = res.html;
		this.commentId = res._id;
		this.postId = res.postId;
		this.threadId = res.threadId;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.sumVotes = res.sumVotes || 0;
		this.userVote = res.userVote || null;
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
