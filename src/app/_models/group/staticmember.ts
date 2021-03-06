/**
 * @desc: Static information about group member
 */
export class StaticMember {
	userId: string;
	name: string;
	color: string;
	
	constructor(res: any) {
		this.userId = res.userId;
		this.name = res.name;
		this.color = res.color;
	}
}
