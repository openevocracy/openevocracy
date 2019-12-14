import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from '../../_services/utils.service';

export class TopicToolbar {
	_id: string;
	name: string;
	nextDeadline: number;
	stage: number;
	
	// Locally calculated
	stageName: string;
	creationDate: number;
	
	constructor(res: any) {
		this._id = res._id;
		this.name = res.name;
		this.nextDeadline = res.nextDeadline;
		this.stage = res.stage;
		
		// Get utils service instance
		const utilsService = this.getUtilsInstance();
		
		// Calculate values
		this.stageName = utilsService.getStageName(this.stage);
		this.creationDate = utilsService.getTimestampFromObjectId(this._id);
	}
	
	/**
	 * @desc: Instantiate utils service
	 */
	private getUtilsInstance() {
		const injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		return injector.get(UtilsService);
	}
}
