export class GroupInternal {
	groupId: string;
	groupName: string;
	topicName: string;
	groupExpiration: number;
	groupMembers;
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.groupName = res.groupName;
		this.topicName = res.topicName;
		this.groupExpiration = res.groupExpiration;
		this.groupMembers = res.groupMembers;
	}
}
