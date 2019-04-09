import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  'comment': string;
}

@Component({
	selector: 'app-editforumcomment',
	templateUrl: './editforumcomment.component.html',
	styleUrls: ['./editforumcomment.component.scss']
})
export class EditForumCommentDialogComponent {
	
	public onSubmit = new EventEmitter();
	
	public comment: string;

	constructor(
		private dialogRef: MatDialogRef<EditForumCommentDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		// Get comment text from parent
		this.comment = data.comment;
	}
	
	public submit() {
		// Check if form is valid
		if(this.comment.trim() == "")
			return;
		
		// Emit edited comment text to parent
		this.onSubmit.emit(this.comment);
		
		// Finally close dialog
		this.close();
	}

	public close() {
		this.dialogRef.close();
	}

}
