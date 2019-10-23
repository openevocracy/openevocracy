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
	public getShortId(id) {
		return id.slice(20,24);
	}
	
	/**
	 * @desc: Strip html from given string
	 */
	public stripHtml(htmlString) {
		return htmlString.replace(/<(?:.|\n)*?>/gm, '');
	}
	
	/**
	 * @desc: Count number of words in string
	 */
	public countStringWords(str) {
		// Split and get length
		return str.split(/\s+\b/).length;
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
}
