import { BasicMember } from './basic-member';

import * as _ from 'underscore';

export class BasicGroup {
	groupId: string;
	groupName: string;
	padId: string;
	docId: string;
	expiration: number;
	isLastGroup: boolean;
	topicId: string;
	topicName: string;
	
	members: BasicMember[];
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.groupName = res.groupName;
		this.padId = res.padId;
		this.docId = res.docId;
		this.expiration = res.expiration;
		this.isLastGroup = res.isLastGroup;
		this.topicId = res.topicId;
		this.topicName = res.topicName;
		
		this.members = _.map(res.members, (member) => {
			return new BasicMember(member);
		});
	}
}
