export class BasicTopic {
	topicId: string;
	stage: number;
	hasProposal: string;
	
	constructor(res: any) {
		this.topicId = res.topicId;
		this.stage = res.stage;
		this.hasProposal = res.hasProposal;
	}
}
