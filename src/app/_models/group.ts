import { GroupMember } from './group-member';

export class Group {
	_id: string;
	tid: string;
	pid: string;
	ppid: string;
	crid: string;
	level: number;
	title: string;
	lastLevel: number;
	nextDeadline: number;
	body: string;
	members: GroupMember[];
	
	constructor(res: any) {
		this._id = res._id;
		this.tid = res.tid;
		this.pid = res.pid;
		this.ppid = res.ppid;
		this.crid = res.crid;
		this.level = res.level;
		this.title = res.title;
		this.lastLevel = res.lastLevel;
		this.nextDeadline = res.nextDeadline;
		this.body = res.body;
		this.members = res.members;
	}
}