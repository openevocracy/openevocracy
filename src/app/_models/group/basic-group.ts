import { BasicMember } from './basic-member';

import * as _ from 'underscore';

export class BasicGroup {
	groupId: string;
	groupName: string;
	expiration: number;
	isLastGroup: boolean;
	topicName: string;
	
	members: BasicMember[];
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.groupName = res.groupName;
		this.expiration = res.expiration;
		this.isLastGroup = res.isLastGroup;
		this.topicName = res.topicName;
		
		this.members = _.map(res.members, (member) => {
			return new BasicMember(member);
		});
	}
}
