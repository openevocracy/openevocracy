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
	
	/**
	 * @desc: Adds a user id to this option and updates count
	 */
	public add(userId): void {
		this.votedUserIds.push(userId);
		
		this.updateCount();
	}
	
	/**
	 * @desc: Removes a user id to this option and updates count
	 */
	public remove(userId): void {
		const userIndex = this.votedUserIds.indexOf(userId);
		this.votedUserIds.splice(userIndex, 1);
		
		this.updateCount();
	}
	
	/**
	 * @desc: Update count
	 */
	public updateCount(): void {
		this.count = this.votedUserIds.length;
	}
}

export class Poll {
	pollId: string;
	options: Option[];
	allowMultipleOptions: boolean;
	countSum: number;
	numGroupMembers: number;
	userIdsVoted: string[];
	
	constructor(res: any) {
		this.pollId = res._id;
		this.allowMultipleOptions = res.allowMultipleOptions;
		this.numGroupMembers = res.numGroupMembers;
		this.userIdsVoted = res.userIdsVoted;
		
		// Add option objects to poll
		this.options = res.options.map((opt) => {
			return new Option({
				'index': opt.index,
				'label': opt.label,
				'votedUserIds': opt.votedUserIds
			});
		});
		
		// Sum option counts
		this.updateCountSum();
	}
	
	/**
	 * @desc: Get chosen options from specific user
	 */
	public getMyChosenOptions(userId): number[] {
		return this.options.map((opt, index) => {
			if (opt.votedUserIds.includes(userId))
				return index;
		});
	}
	
	/**
	 * @desc: Update count sum
	 */
	public updateCountSum(): void {
		this.countSum = 0;
		this.options.forEach((opt) => {
			this.countSum += opt.count;
		});
	}
	
	/**
	 * @desc: Remove a specific user from all options
	 * 		 Necessary if only one option is possible
	 */
	public removeUserIdFromAllOptions(userId: string): void {
		this.options.forEach((opt) => {
			const userIndex = opt.votedUserIds.indexOf(userId);
			if (userIndex != -1) {
				opt.votedUserIds.splice(userIndex, 1);
				opt.updateCount();
			}
		});
	}
}
