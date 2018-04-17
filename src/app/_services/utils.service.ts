import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

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
	
	// from https://stackoverflow.com/questions/35474991/angular-2-form-validating-for-repeat-password
	public areEqual(c: AbstractControl): ValidationErrors | null {
		const keys: string[] = Object.keys(c.value);
		for (const i in keys) {
			if (i !== '0' && c.value[ keys[ +i - 1 ] ] !== c.value[ keys[ i ] ]) {
				return { areEqual: true };
			}
		}
	}

}
