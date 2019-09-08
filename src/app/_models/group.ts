import { GroupMember } from './group-member';

export class Group {
	groupId: string;
	name: string;
	topicId: string;
	docId: string;
	chatRoomId: string;
	forumId: string;
	level: number;
	title: string;
	isLastGroup: number;
	nextDeadline: number;
	members: GroupMember[];
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.name = res.name;
		this.topicId = res.topicId;
		this.docId = res.docId;
		this.chatRoomId = res.chatRoomId;
		this.forumId = res.forumId;
		this.level = res.level;
		this.title = res.title;
		this.isLastGroup = res.isLastGroup;
		this.nextDeadline = res.nextDeadline;
		this.members = res.members;
	}
}