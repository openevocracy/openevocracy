export class Option {
	index: number;
	label: string;
	votedUserIds: string[];
	count: number;
	
	constructor(res: any) {
		this.index = res.index;
		this.label = res.label;
		this.votedUserIds = res.votedUserIds;
		this.count = res.votedUserIds.length;
	}
}

export class Poll {
	pollId: string;
	options: Option[];
	allowMultipleOptions: boolean;
	countSum: number;
	numGroupMembers: number;
	
	constructor(res: any) {
		this.pollId = res._id;
		this.allowMultipleOptions = res.allowMultipleOptions;
		this.numGroupMembers = res.numGroupMembers;
		
		// Add option objects to poll
		this.options = res.options.map((opt) => {
			return new Option({
				'index': opt.index,
				'label': opt.label,
				'votedUserIds': opt.votedUserIds
			});
		});
		
		// Sum option counts
		this.countSum = 0;
		this.options.forEach((opt) => {
			this.countSum += opt.count;
		});
	}
}
