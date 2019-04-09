import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  'postHtml': string;
}

@Component({
	selector: 'app-editforumpost',
	templateUrl: './editforumpost.component.html',
	styleUrls: ['./editforumpost.component.scss']
})
export class EditForumPostDialogComponent {
	
	public onSubmit = new EventEmitter();
	
	public postHtml: string;
	
	public editor;

	constructor(
		private dialogRef: MatDialogRef<EditForumPostDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		// Get post html from parent
		this.postHtml = data.postHtml;
	}
	
	public editorCreated(editor: any) {
		// Save editor
		this.editor = editor;
		
		// Set editor contents
		this.editor.clipboard.dangerouslyPasteHTML(0, this.postHtml);
	}
	
	public submit() {
		// Check if editor is not empty
		if(this.editor.getText().trim() == "")
			return;
			
		// Get html from editor
		this.postHtml = this.editor.root.innerHTML;
		
		// Emit edited comment text to parent
		this.onSubmit.emit(this.postHtml);
		
		// Finally close dialog
		this.close();
	}

	public close() {
		this.dialogRef.close();
	}

}
