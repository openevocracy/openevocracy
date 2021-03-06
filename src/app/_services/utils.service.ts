import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

import { C } from '../../../shared/constants';

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
	
	/*
	 * @desc: Get only the last 4 digits of an id
	 *        The goal is to get a human readable identifier
	 */
	/*public getShortId(id) {
		return id.slice(20,24);
	}*/
	
	/**
	 * @desc: Strip html from given string
	 */
	public stripHtml(htmlString): string {
		return htmlString.replace(/<(?:.|\n)*?>/gm, '');
	}
	
	/**
	 * @desc: Count number of words in string
	 */
	public countStringWords(str): number {
		// Split and get length
		return str.split(/\s+\b/).length;
	}
	
	/**
	 * @desc: Strip html tags and count words
	 */
	public countHtmlWords(htmlString): number {
		return this.countStringWords(this.stripHtml(htmlString));
	}
	
	/**
	 * @desc: Replace all occurencies of 'find' in a string 'str' and replace it by 'replace'
	 */
	public replaceAll(str, find, replace) {
		// Make search safe against special characters in regular expressions
		const findSave = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
		// Replace all
		return str.replace(new RegExp(findSave, 'g'), replace);
	}
	
	/**
	 * @desc: Gets a stage key and returns the name of the stage
	 */
	public getStageName(stageKey) {
		switch(stageKey) {
			case C.STAGE_SELECTION:
				return "TOPIC_STAGE_SELECTION";
			case C.STAGE_PROPOSAL:
				return "TOPIC_STAGE_PROPOSAL";
			case C.STAGE_CONSENSUS:
				return "TOPIC_STAGE_CONSENSUS";
			case C.STAGE_PASSED:
				return "TOPIC_STAGE_PASSED";
			case C.STAGE_REJECTED:
				return "TOPIC_STAGE_REJECTED";
		}
	}
	
	/**
	 * @desc: Translates from number (basis 10) to letter (basis A-Z) code
	 * @source: https://stackoverflow.com/a/45789255/2692283
	 */
	public numberToLetters(num: number): string {
		// Initialize variables
		let s = '';
		let t;
		
		// Start while loop
		while (num > 0) {
			// Calc remainder of the number
			t = (num - 1) % 26;
			// Get letter for current remainder and append to front
			s = String.fromCharCode(65 + t) + s;
			// Get next digit
			num = (num - t)/26 | 0;
		}
		
		// Return letter code or undefined (if num was 0)
		return s || undefined;
	}
}
