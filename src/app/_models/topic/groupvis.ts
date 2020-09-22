import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../../_services/utils.service';

class Proposal {
	padId: string;
	authorId: string;
	html: string;
	numWords: number;  // TODO: do it in a function on client
	expiration: number;
	isExpired: boolean;
	textDetailSuffix: string = 'GROUPVIS_PROPOSAL_DETAIL_SUFFIX';
	
	constructor(res: any) {
		this.padId = res.padId;
		this.authorId = res.authorId;
		this.html = res.html;
		this.numWords = res.numWords;
		this.expiration = res.expiration;
		
		// Calculate isExpired
		const date = new Date();
		this.isExpired = (this.expiration < date.getTime());
		
		if (this.isExpired)
			this.textDetailSuffix = 'GROUPVIS_PROPOSAL_DETAIL_SUFFIX_EXPIRED';
	}
}

class Group {
	groupId: string;
	name: string;
	numWords: number;  // TODO: do it in a function on client
	numMembers: number;
	expiration: number;
	isExpired: boolean;
	textDetail: string = 'GROUPVIS_GROUP_DETAIL';
	
	groupCode: string;
	
	constructor(res: any) {
		this.groupId = res.groupId;
		this.name = res.name;
		this.numWords = res.numWords;
		this.numMembers = res.numMembers;
		this.expiration = res.expiration;
		
		// Calculate isExpired
		const date = new Date();
		this.isExpired = (this.expiration < date.getTime());
		
		// Calculate group code
		this.code = this.calcGroupCode(res.groupLevel, res.groupNum);
		
		if (this.isExpired)
			this.textDetail = 'GROUPVIS_GROUP_DETAIL_EXPIRED';
	}
	
	/**
	 * @desc: Calculates a code for the group, consisting of the level and the group number
	 */
	public calcGroupCode(level: number, num: number): string {
		// Instantiate utils service
		const injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		const utilsService = injector.get(UtilsService);
		
		// Translate number to letter code for level
		const levelLetter = utilsService.numberToLetters(level+1);
		
		// Combine level letter and number of group and return final group code
		return levelLetter + (num+1);
	}
}

export { Proposal, Group }
