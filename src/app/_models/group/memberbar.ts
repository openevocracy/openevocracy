import { StaticMember } from './staticmember';

export class Member extends StaticMember {
	isOnline: boolean;
	
	constructor(res: any) {
		super(res);
		
		this.isOnline = res.isOnline;
	}
}
