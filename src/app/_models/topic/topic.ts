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
		
		// Get utils service instance
		const utilsService = this.getUtilsInstance();
		
		// Define further variables
		this.group = res.group;
		this.proposal = res.proposal;
		this.description = res.description;
		//this.group_members = res.group_members;
		
		this.stageName = utilsService.getStageName(this.stage);
		this.creationDate = utilsService.getTimestampFromObjectId(this._id);
	}
	
	/**
	 * @desc: Instantiate utils service
	 */
	private getUtilsInstance() {
		const injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		return injector.get(UtilsService);
	}
}











