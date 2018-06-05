import { GroupMember } from './group-member';

export class Group {
	groupId: string;
	topicId: string;
	docId: string;
	chatRoomId: string;
	level: number;
	title: string;
	isLastGroup: number;
	nextDeadline: number;
	members: GroupMember[];
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.topicId = res.topicId;
		this.docId = res.docId;
		this.chatRoomId = res.chatRoomId;
		this.level = res.level;
		this.title = res.title;
		this.isLastGroup = res.isLastGroup;
		this.nextDeadline = res.nextDeadline;
		this.members = res.members;
	}
}