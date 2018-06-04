import { GroupMember } from './group-member';

export class Group {
	_id: string;
	topicId: string;
	docId: string;
	chatRoomId: string;
	level: number;
	title: string;
	lastLevel: number;
	nextDeadline: number;
	members: GroupMember[];
	
	constructor(res: any) {
		this._id = res._id;
		this.topicId = res.topicId;
		this.docId = res.docId;
		this.chatRoomId = res.chatRoomId;
		this.level = res.level;
		this.title = res.title;
		this.lastLevel = res.lastLevel;
		this.nextDeadline = res.nextDeadline;
		this.members = res.members;
	}
}