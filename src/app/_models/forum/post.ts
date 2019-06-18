import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

import { Comment } from './comment';

export class Post {
	/* Raw values from database */
	html: string;
	postId: string;
	threadId: string;
	forumId: string;
	authorId: string;
	authorName: string;
	comments: Comment[];
	sumVotes: number;
	userVote: number;
	
	/* Calculated values */
	createdTimestamp: number;
	
	constructor(res: any) {
		this.html = res.html;
		this.postId = res._id;
		this.threadId = res.threadId;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.authorName = res.authorName || null;
		this.comments = res.comments;
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
