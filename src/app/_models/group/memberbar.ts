import { BasicMember } from './basic-member';

export class Member extends BasicMember {
	isOnline: boolean;
	
	constructor(res: any) {
		super(res);
		
		this.isOnline = res.isOnline;
	}
}
