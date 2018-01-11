import { TopicListElement } from './topic-list-element';
import * as _ from 'underscore';

import { C } from '../_shared/constants';

import { Group } from './group';
import { Proposal } from './proposal';
import { GroupMember } from './group-member';

export class Topic extends TopicListElement {
	/* Extended information */
    groups: Group[];
    proposals: Proposal[];
    body: string;
    group_members: GroupMember[];
    gid: string;
    ppid: string;
    
    constructor(res: any) {
        super(res);
        this.groups = res.groups;
        this.proposals = res.proposals;
        this.body = res.body;
        this.group_members = res.group_members;
        this.gid = res.gid;
        this.ppid = res.ppid;
    }
    
    private get stageName() {
        switch(this.stage) {
            case C.STAGE_SELECTION:
                return "STAGE_SELECTION";
            case C.STAGE_PROPOSAL:
                return "STAGE_PROPOSAL";
            case C.STAGE_CONSENSUS:
                return "STAGE_CONSENSUS";
            case C.STAGE_PASSED:
                return "STAGE_PASSED";
            case C.STAGE_REJECTED:
                return "STAGE_REJECTED";
        }
    }
    
    private get numProposals() {
        return _.size(this.proposals);
    }
}











