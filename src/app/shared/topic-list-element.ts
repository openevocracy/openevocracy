//import { Level } from './level';

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
    /*num_votes: number;
    voted: boolean;
    levels: Level[];
    groups: null;
    proposals: null;
    body: null;
    group_members: null;
    gid: null;
    ppid: null;*/
}