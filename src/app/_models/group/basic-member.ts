export class BasicMember {
	userId: string;
	name: string;
	color: string;
	prevGroupId: string;
	prevPadHtml: string;
	
	constructor(res: any) {
		this.userId = res.userId;
		this.name = res.name;
		this.color = res.color;
		this.prevGroupId = res.prevGroupId;
		this.prevPadHtml = res.prevPadHtml;
	}
}
