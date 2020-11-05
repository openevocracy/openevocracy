export class TopicProposal {
	authorId: string;
	html: string;
	docId: string;
	padId: string;
	
	constructor(res: any) {
		this.authorId = res.authorId;
		this.html = res.html;
		this.docId = res.docId;
		this.padId = res._id;
	}
}
