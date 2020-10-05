import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import { CustomValidators } from '../../_utils/custom-validators';
import { Thread } from "../../_models/forum/thread";

import * as _ from 'underscore';

import { faPoll, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export interface DialogData {
	'mainPostHtml': string,
	'thread': Thread
}

@Component({
	selector: 'app-editthread',
	templateUrl: './editthread.component.html',
	styleUrls: ['./editthread.component.scss']
})
export class EditThreadDialogComponent {
	
	public onSubmit = new EventEmitter();

	public allowMultipleOptions: boolean = false;
	//public options: number[] = [1,2];
	public showOptions: boolean = false;
	
	public heading: string;
	public buttonLabel: string;
	public mainPostHtml: string;

	public editor;
	public editThreadForm: FormGroup;
	public onlyMembers: boolean = false;
	
	// FontAwesome icons
	public faPoll = faPoll;
	public faTimesCircle = faTimesCircle;

	constructor(
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<EditThreadDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		this.editThreadForm = this.fb.group({
			title: ['', CustomValidators.required],
			options: this.fb.array([
				this.fb.control('')
			])
		});
		
		// If no thread was injected, create a new thread
		if (_.isNull(this.data)) {
			// Set heading and button label
			this.heading = 'FORUM_DIALOG_NEW_THREAD_HEADING';
			this.buttonLabel = 'FORUM_BUTTON_NEW_THREAD';
		}
		// If thread was injected, edit existing thread
		else {
			// Store main post html (is set after editor is ready)
			this.mainPostHtml = this.data.mainPostHtml;
			
			// Set title and onlyMembers
			this.editThreadForm.patchValue({ 'title': this.data.thread.title });
			this.onlyMembers = this.data.thread.private;
			
			// Set heading and button label
			this.heading = 'FORUM_DIALOG_EDIT_THREAD_HEADING';
			this.buttonLabel = 'FORUM_BUTTON_EDIT_THREAD';
		}
	}
	
	public ngAfterViewChecked() {
		// This is added to avoid an ugly gui effect regarding mat-accordion
		// The timeout is necessary to avoid an error, see: https://blog.angular-university.io/angular-debugging/
		setTimeout(() => {
			this.showOptions = true;
		});
	}
	
	/**
	 * @desc: Getter for poll options form array
	 */
	get options(): FormArray {
		return this.editThreadForm.get('options') as FormArray;
	}
	
	public close() {
		this.dialogRef.close();
	}
	
	public editorCreated(editor: any) {
		this.editor = editor;
		
		// Set editor html content if content was given
		if (!_.isNull(this.data))
			this.editor.clipboard.dangerouslyPasteHTML(0, this.mainPostHtml);
	}
	
	/**
	 * @desc: Adds an option from poll
	 */
	public addPollOption(): void {
		//const last = this.options[this.options.length-1];
		//this.options.push(last+1);
		this.options.push(this.fb.control(''));
	}
	
	/**
	 * @desc: Removes an option from poll
	 */
	public removePollOption(index): void {
		//this.options.splice(index, 1);
		this.options.removeAt(index);
	}
	
	/**
	 * @desc: Allow or disallow to choose multiple poll options
	 */
	public onSlidePollAllowMultiple(e: any): void {
		this.allowMultipleOptions = e.checked;
	}
	
	/**
	 * @desc: Allow or disallow posts and comments of non-members
	 */
	public onSlideMembersOnly(e: any): void {
		this.onlyMembers = e.checked;
	}
	
	public submit() {
		// Check if form is valid
		if(!this.editThreadForm.valid || this.editor.getText().trim() == "")
			return;
		
		// Remove empty options
		const optionsTrimmed = _.reject(this.options.value, (option) => {
			return option.trim() == "";
		});
		
		// Only add poll if at least two non-empty poll options are defined by the user
		let poll = null;
		if (optionsTrimmed.length >= 2) {
			poll = {
				'options': this.options.value,
				'allowMultipleOptions': this.allowMultipleOptions
			};
		}
		
		// Bundle all form data
		const thread = {
			'title': this.editThreadForm.value.title,
			'html': this.editor.root.innerHTML,
			'private': this.onlyMembers,
			'poll': poll
		}
		
		// Emit to parent
		this.onSubmit.emit(thread);
		
		// Finally close dialog
		this.close();
	}

}
