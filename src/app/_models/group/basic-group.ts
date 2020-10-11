import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../../_services/utils.service';
import { BasicMember } from './basic-member';

import * as _ from 'underscore';

export class BasicGroup {
	groupId: string;
	groupName: string;
	padId: string;
	docId: string;
	padHtml: string;
	expiration: number;
	isLastGroup: boolean;
	topicId: string;
	topicName: string;
	
	members: BasicMember[];
	groupCode: string;
	isExpired: boolean;
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.groupName = res.groupName;
		this.padId = res.padId;
		this.docId = res.docId;
		this.padHtml = res.padHtml;
		this.expiration = res.expiration;
		this.isLastGroup = res.isLastGroup;
		this.topicId = res.topicId;
		this.topicName = res.topicName;
		
		// Instantiate members
		this.members = _.map(res.members, (member) => {
			return new BasicMember(member);
		});
		
		// Calculate group code
		this.groupCode = this.calcGroupCode(res.groupLevel, res.groupNumber);
		
		// Check if group is already expired
		const date = new Date();
		this.isExpired = (this.expiration < date.getTime());
	}
	
	/**
	 * @desc: Searches for a user in group members and returns boolean flag of member status
	 */
	public isMember(userId: string): boolean {
		// Try to find member in group members
		const member = _.findWhere(this.members, { 'userId': userId });
		
		// Returns true or false (depending if member was found or not)
		return !_.isNull(member);
	}
	
	/**
	 * @desc: Searches for a user in group members and returns name of member
	 */
	public memberName(userId: string): string {
		// Try to find member in group members
		const member = _.findWhere(this.members, { 'userId': userId });
		
		// Returns name of member
		return member.name;
	}
	
	/**
	 * @desc: Calculates a code for the group, consisting of the level and the group number
	 */
	public calcGroupCode(level: number, num: number): string {
		// Instantiate utils service
		const injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		const utilsService = injector.get(UtilsService);
		
		// Translate number to letter code for level
		const levelLetter = utilsService.numberToLetters(level+1);
		
		// Combine level letter and number of group and return final group code
		return levelLetter + (num+1);
	}
}
