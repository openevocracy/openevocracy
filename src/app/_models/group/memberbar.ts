export class Member {
	userId: string;
	name: string;
	color: string;
	isOnline: boolean;
	
	constructor(res: any) {
		this.userId = res.userId;
		this.name = res.name;
		this.color = res.color;
		this.isOnline = res.isOnline;
	}
}
