import { Injectable } from '@angular/core';

@Injectable()
export class UtilsService {
	
	constructor() { }
	
	public getTimestampFromObjectId(tid) {
		// Get timestamp from topic id in hex format from Object Id
		var hexTimestamp = tid.toString().substring(0,8);
		// Parse hex timestamp to integer
		var intTimestamp = parseInt(hexTimestamp, 16);
		// Return timestamp in milliseconds
		return intTimestamp*1000;
	}

}
