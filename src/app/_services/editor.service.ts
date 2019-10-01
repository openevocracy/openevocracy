import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class EditorService {

	private isEditorSaved = {};
	
	constructor() { }
	
	/**
	 * @desc: Add status of editor for given group, either saved (true) or unsaved (false)
	 */
	public setIsSaved(padId: string, status: boolean) {
		this.isEditorSaved[padId] = status;
	}
	
	/**
	 * @desc: Get status of editor for given group, either saved (true) or unsaved (false)
	 */
	public isSaved(padId: string): boolean {
		return this.isEditorSaved[padId];
	}
}
