import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable()
export class UtilsService {
	
	constructor() { }
	
	/*
	 * @desc: Calculate timestamp from given Object Id
	 */
	public getTimestampFromObjectId(id) {
		// Get timestamp from topic id in hex format from Object Id
		var hexTimestamp = id.toString().substring(0,8);
		// Parse hex timestamp to integer
		var intTimestamp = parseInt(hexTimestamp, 16);
		// Return timestamp in milliseconds
		return intTimestamp*1000;
	}
	
	/*
	 * @desc: Angular form validator to check if field contents are equal
	 * @source: https://stackoverflow.com/a/45837475/2692283
	 */
	public areEqual(c: AbstractControl): ValidationErrors | null {
		const keys: string[] = Object.keys(c.value);
		for (const i in keys) {
			if (i !== '0' && c.value[ keys[ +i - 1 ] ] !== c.value[ keys[ i ] ]) {
				return { areEqual: true };
			}
		}
	}
	
	/*
	 * @desc: Get language from browser
	 * Remark: this function cannot be in language service, because of circular dependencies
	 */ 
	public getBrowserLanguage() {
		let browserLang = navigator.language || navigator['userLanguage'];
		return browserLang.split('-')[0];
	}
}
