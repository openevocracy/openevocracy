export class BasicTopic {
	topicId: string;
	stage: number;
	hasProposal: boolean;
	nextDeadline: number;
	
	constructor(res: any) {
		this.topicId = res.topicId;
		this.stage = res.stage;
		this.hasProposal = res.hasProposal;
		this.nextDeadline = res.nextDeadline;
	}
}
