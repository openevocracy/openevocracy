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
    
    /* Derived information */
    stageName: string;
    num_proposals: number;
    
    constructor(res: any) {
        super(res);
        this.groups = res.groups;
        this.proposals = res.proposals;
        this.body = res.body;
        this.group_members = res.group_members;
        this.gid = res.gid;
        this.ppid = res.ppid;
        
        /* Add derived information */
        this.addStageName();
        this.addNumProposals();
    }
    
    private addStageName() {
        switch(this.stage) {
            case C.STAGE_SELECTION:
                this.stageName = "Auswahlphase"; break;
            case C.STAGE_PROPOSAL:
                this.stageName = "Vorschlagphase"; break;
            case C.STAGE_CONSENSUS:
                this.stageName = "Konsensphase"; break;
            case C.STAGE_PASSED:
                this.stageName = "Abgeschlossen"; break;
            case C.STAGE_REJECTED:
                this.stageName = "Verworfen"; break;
        }
    }
    
    private addNumProposals() {
        this.num_proposals = _.size(this.proposals);
    }
}
