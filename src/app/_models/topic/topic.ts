import { TopicListElement } from './topiclist-element';
import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { Proposal } from '../proposal';
import { TopicDescription } from './topic-description';
import { TopicGroup } from './topic-group';
import { TopicGroupMember } from './topic-group-member';

import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../../_services/utils.service';

export class Topic extends TopicListElement {
	/* Extended information */
	group: TopicGroup;
	proposal: Proposal;
	description: TopicDescription;
	//group_members: TopicGroupMember[];
	
	/* Locally calculated */
	stageName: string;
	creationDate: number;
	
	constructor(res: any) {
		super(res);
		this.group = res.group;
		this.proposal = res.proposal;
		this.description = res.description;
		//this.group_members = res.group_members;
		
		this.stageName = this.getStageName();
		this.creationDate = this.getCreationDate();
	}
	
	private getStageName() {
		switch(this.stage) {
			case C.STAGE_SELECTION:
				return "TOPIC_STAGE_SELECTION";
			case C.STAGE_PROPOSAL:
				return "TOPIC_STAGE_PROPOSAL";
			case C.STAGE_CONSENSUS:
				return "TOPIC_STAGE_CONSENSUS";
			case C.STAGE_PASSED:
				return "TOPIC_STAGE_PASSED";
			case C.STAGE_REJECTED:
				return "TOPIC_STAGE_REJECTED";
		}
	}
	
	private getCreationDate() {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(this._id);
	}
}











