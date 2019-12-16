export class TopicOverview {
	authorId: string;
	descHtml: string;
	descDocId: string;
	descPadId: string;
	voted: boolean;
	myGroupId: string;
	
	constructor(res: any) {
		this.authorId = res.authorId;
		this.descHtml = res.descHtml;
		this.descDocId = res.descDocId;
		this.descPadId = res.descPadId;
		this.voted = res.voted;
		this.myGroupId = res.myGroupId;
	}
}
