import { Component, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';

import { CustomValidators } from '../../_utils/custom-validators';

@Component({
	selector: 'app-newthread',
	templateUrl: './newthread.component.html',
	styleUrls: ['./newthread.component.scss']
})
export class NewThreadDialogComponent {
	
	public onSubmit = new EventEmitter();

	public editor;
	public newthreadForm: FormGroup;
	public slideChecked: boolean = false;

	constructor(
		private fb: FormBuilder,
		private dialogRef: MatDialogRef<NewThreadDialogComponent>
	) {
		this.newthreadForm = this.fb.group({
			title: ['', CustomValidators.required]
		});
	}
	
	public close() {
		this.dialogRef.close();
	}
	
	public editorCreated(editor: any) {
		this.editor = editor;
	}
	
	public onSlide(e: any) {
		this.slideChecked = e.checked;
	}
	
	public submit() {
		// Check if form is valid
		if(!this.newthreadForm.valid || this.editor.getText().trim() == "")
			return;
		
		// Bundle all form data
		var thread = {
			'title': this.newthreadForm.value.title,
			'html': this.editor.container.firstChild.innerHTML,
			'private': this.slideChecked
		}
		
		// Emit to parent
		this.onSubmit.emit(thread);
		
		// Finally close dialog
		this.close();
	}

}
