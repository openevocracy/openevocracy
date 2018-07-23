import { Level } from '../level';

import * as _ from 'underscore';

export class TopicListElement {
	/* Original topic (as it is stored in db) */
	_id: string;
	name: string;
	stage: number;
	level: number;
	nextDeadline: number;
	owner: string;
	rejectedReason: string;
	stageProposalStarted: number;
	stageConsensusStarted: number;
	stagePassedStarted: number;
	stageRejectedStarted: number;
	validParticipants: number;
	finalDocument: string;
	
	/* Extended information (additional to db info) */
	numVotes: number;
	numProposals: number;
	voted: boolean;
	levels: Level[];
	
	/* Locally created */
	numActiveGroups: number;
	numActiveParticipants: number;
	
	constructor(res: any) {
		this._id = res._id;
		this.name = res.name;
		this.stage = res.stage;
		this.level = res.level;
		this.nextDeadline = res.nextDeadline;
		this.owner = res.owner;
		this.rejectedReason = res.rejectedReason;
		this.stageProposalStarted = res.stageProposalStarted;
		this.stageConsensusStarted = res.stageConsensusStarted;
		this.stagePassedStarted = res.stagePassedStarted;
		this.stageRejectedStarted = res.stageRejectedStarted;
		this.validParticipants = res.validParticipants;
		this.finalDocument = res.finalDocument;
		this.numVotes = res.numVotes;
		this.numProposals = res.numProposals;
		this.voted = res.voted;
		this.levels = res.levels
		
		this.numActiveGroups = this.getLastLevel('groups');
		this.numActiveParticipants = this.getLastLevel('participants');
	}
	
	private getLastLevel(type) {
		let numLevels = _.size(this.levels);
		if(numLevels != 0) {
			let lastLevel = this.levels[numLevels-1];
			return lastLevel[type];
		} else {
			return null;
		}
	}
}
