import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

import { Response } from './response';

import * as _ from 'underscore';

export class Thread {
	/* Raw values from database */
	threadId: string;
	mainPostId: string;
	title: string;
	forumId: string;
	authorId: string;
	authorName: string;
	citationId: string;
	closed: boolean;
	private: boolean;
	views: number;
	postCount: number;
	sumMainpostVotes: number;
	lastResponse: Response;
	notifyStatus: boolean;
	isGroupMember: boolean;
	wasViewed: boolean;
	
	/* Calculated values */
	createdTimestamp: number;
	lastActivityTimestamp: number;
	
	constructor(res: any) {
		this.threadId = res._id;
		this.mainPostId = res.mainPostId;
		this.title = res.title;
		this.forumId = res.forumId;
		this.authorId = res.authorId;
		this.authorName = res.authorName || null;
		this.citationId = res.citationId;
		this.closed = res.closed;
		this.private = res.private;
		this.views = res.views;
		this.postCount = res.postCount || 0;
		this.sumMainpostVotes = res.sumMainpostVotes || 0;
		this.createdTimestamp = this.getCreationTimestamp(res._id);
		this.notifyStatus = _.isNull(res.notifyStatus) ? false : res.notifyStatus;
		this.isGroupMember = res.isGroupMember;
		this.wasViewed = res.wasViewed;
		
		// If last response is not set, use creation time as last activity (important for sorting)
		this.lastActivityTimestamp = res.lastResponse ? res.lastResponse.timestamp : this.createdTimestamp;
		
		// Create last resonse model, including user id, user name and timestamp of last response
		this.lastResponse = res.lastResponse ? new Response(res.lastResponse) : null;
	}
	
	private getCreationTimestamp(id) {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(id);
	}
}
