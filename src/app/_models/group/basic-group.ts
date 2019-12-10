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
		
		this.members = _.map(res.members, (member) => {
			return new BasicMember(member);
		});
		
		// Check if group is already expired
		const date = new Date();
		this.isExpired = (this.expiration < date.getTime());
	}
	
	/**
	 * @desc: Searches for a user in group members and returns boolean flag of member status
	 */
	public isMember(userId: string): boolean {
		// Try to find user in group members
		const user = _.findWhere(this.members, { 'userId': userId });
		
		// Returns true or false (depending if user was found or not)
		return !_.isNull(user);
	}
}
