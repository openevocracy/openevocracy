import { ReflectiveInjector } from '@angular/core';
import { UtilsService } from "../../_services/utils.service";

export class Edit {
	authorId: string;
	
	createdTimestamp: number;
	
	constructor(res: any) {
		this.authorId = res.authorId;
		this.createdTimestamp = this.getCreationTimestamp(res._id);
	}

	private getCreationTimestamp(id) {
		// Instantiate utils service
		var injector = ReflectiveInjector.resolveAndCreate([UtilsService]);
		var utilsService = injector.get(UtilsService);
		
		// Get Timestamp from ObjectId
		return utilsService.getTimestampFromObjectId(id);
	}	
}