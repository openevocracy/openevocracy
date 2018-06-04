import { Level } from '../level';

export class TopicListElement {
	/* Original topic */
	_id: string;
	name: string;
	stage: number;
	level: number;
	nextDeadline: number;
	owner: string;
	rejectedReason: string;
	stageConsensusStarted: number;
	stagePassedStarted: number;
	stageProposalStarted: number;
	valid_participants: number;
	finalDocument: string;
	
	/* Extended information */
	num_votes: number;
	num_proposals: number;
	voted: boolean;
	levels: Level[];
	 
	constructor(res: any) {
		this._id = res._id;
		this.name = res.name;
		this.stage = res.stage;
		this.level = res.level;
		this.nextDeadline = res.nextDeadline;
		this.owner = res.owner;
		this.rejectedReason = res.rejectedReason;
		this.stageConsensusStarted = res.stageConsensusStarted;
		this.stagePassedStarted = res.stagePassedStarted;
		this.stageProposalStarted = res.stageProposalStarted;
		this.valid_participants = res.valid_participants;
		this.finalDocument = res.finalDocument;
		this.num_votes = res.num_votes;
		this.num_proposals = res.num_proposals;
		this.voted = res.voted;
		this.levels = res.levels;
	}
}
