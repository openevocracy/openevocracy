export class Activity {
	userId: string;
	userName: string;
	timestamp: number;
	
	constructor(res: any) {
		this.userId = res.userId;
		this.userName = res.userName;
		this.timestamp = res.timestamp;
	}
}
