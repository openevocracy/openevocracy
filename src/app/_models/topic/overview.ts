export class TopicOverview {
	authorId: string;
	descHtml: string;
	descDocId: string;
	stage: number;
	voted: boolean;
	myGroupId: string;
	
	constructor(res: any) {
		this.authorId = res.authorId;
		this.descHtml = res.descHtml;
		this.descDocId = res.descDocId;
		this.stage = res.stage;
		this.voted = res.voted;
		this.myGroupId = res.myGroupId;
	}
}
