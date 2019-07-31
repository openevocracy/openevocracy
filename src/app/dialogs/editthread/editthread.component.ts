import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';

import { CustomValidators } from '../../_utils/custom-validators';
import { Thread } from "../../_models/forum/thread";

import * as _ from 'underscore';

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

	public heading: string;
	public buttonLabel: string;
	public mainPostHtml: string;

	public editor;
	public editThreadForm: FormGroup;
	public onlyMembers: boolean = false;

	constructor(
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<EditThreadDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		this.editThreadForm = this.fb.group({
			title: ['', CustomValidators.required]
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
	
	public close() {
		this.dialogRef.close();
	}
	
	public editorCreated(editor: any) {
		this.editor = editor;
		
		// Set editor html content if content was given
		if (!_.isNull(this.data))
			this.editor.clipboard.dangerouslyPasteHTML(0, this.mainPostHtml);
	}
	
	public onSlide(e: any) {
		this.onlyMembers = e.checked;
	}
	
	public submit() {
		// Check if form is valid
		if(!this.editThreadForm.valid || this.editor.getText().trim() == "")
			return;
		
		// Bundle all form data
		var thread = {
			'title': this.editThreadForm.value.title,
			'html': this.editor.root.innerHTML,
			'private': this.onlyMembers
		}
		
		// Emit to parent
		this.onSubmit.emit(thread);
		
		// Finally close dialog
		this.close();
	}

}
