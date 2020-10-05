export class Option {
	label: string;
	count: number;
	
	constructor(res: any) {
		this.label = res.label;
		this.count = res.count;
	}
}

export class Poll {
	options: Option[];
	allowMultipleOptions: boolean;
	countSum: number = 0;
	
	constructor(res: any) {
		this.allowMultipleOptions = res.allowMultipleOptions;
		this.options = res.options.map((opt) => {
			return new Option({ 'label': opt.label, 'count': opt.count });
		});
		// Sum option counts
		this.options.forEach((opt) => {
			this.countSum += opt.count;
		});
	}
}
