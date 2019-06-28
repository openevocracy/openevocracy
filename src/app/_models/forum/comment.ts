import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

import { Edit } from './edit';

export class Comment {
	/* Raw values from database */
	html: string;
	commentId: string;
	postId: string;
	threadId: string;
	authorName: string;
	forumId: string;
	authorId: string;
	sumVotes: number;
	userVote: number;
	editHistory: Edit[];
	
	/* Calculated values */
	createdTimestamp: number;
	
	constructor(res: any) {
		this.html = res.html;
		this.commentId = res._id;
		this.postId = res.postId;
		this.threadId = res.threadId;
		this.authorName = res.authorName || null;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.sumVotes = res.sumVotes || 0;
		this.userVote = res.userVote || null;
		this.createdTimestamp = this.getCreationTimestamp(res._id);
		this.editHistory = res.editHistory.map(edit => new Edit(edit));
	}
	
	private getCreationTimestamp(id) {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(id);
	}
}
