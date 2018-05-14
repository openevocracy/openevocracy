import { TopicListElement } from './topiclist-element';
import * as _ from 'underscore';

import { C } from '../../../shared/constants';

import { Group } from './group';
import { Proposal } from './proposal';
import { TopicGroupMember } from './topic-group-member';

import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../_services/utils.service';

export class Topic extends TopicListElement {
	/* Extended information */
	groups: Group[];
	proposals: Proposal[];
	group_members: TopicGroupMember[];
	gid: string;
	gpid: string;
	group_html: string;
	dpid: string;
	description_html: string;
	ppid: string;
	proposal_html: string;
	
	/* Locally calculated */
	stageName: string;
	creationDate: number;
	
	constructor(res: any) {
		super(res);
		this.groups = res.groups;
		this.proposals = res.proposals;
		this.group_members = res.group_members;
		this.gid = res.gid;
		this.gpid = res.gpid;
		this.group_html = res.group_html;
		this.dpid = res.dpid;
		this.description_html = res.description_html;
		this.ppid = res.ppid;
		this.proposal_html = res.proposal_html;
		
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











