import { TopicListElement } from './topic-list-element';
import * as _ from 'underscore';

import { C } from '../../../shared/constants';

import { Group } from './group';
import { Proposal } from './proposal';
import { GroupMember } from './group-member';

import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../_services/utils.service';

export class Topic extends TopicListElement {
	/* Extended information */
	groups: Group[];
	proposals: Proposal[];
	body: string;
	group_members: GroupMember[];
	gid: string;
	pid: string;
	ppid: string;
	
	/* Locally calculated */
	stageName: string;
	creationDate: number;
	
	constructor(res: any) {
		super(res);
		this.groups = res.groups;
		this.proposals = res.proposals;
		this.body = res.body;
		this.group_members = res.group_members;
		this.gid = res.gid;
		this.pid = res.pid;
		this.ppid = res.ppid;
		
		this.stageName = this.getStageName();
		this.creationDate = this.getCreationDate();
	}
	
	private getStageName() {
		switch(this.stage) {
			case C.STAGE_SELECTION:
				return "STAGE_SELECTION";
			case C.STAGE_PROPOSAL:
				return "STAGE_PROPOSAL";
			case C.STAGE_CONSENSUS:
				return "STAGE_CONSENSUS";
			case C.STAGE_PASSED:
				return "STAGE_PASSED";
			case C.STAGE_REJECTED:
				return "STAGE_REJECTED";
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











