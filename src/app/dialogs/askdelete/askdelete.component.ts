import { Component, Inject, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  'deleteDescription': string;
}

@Component({
	selector: 'app-askdelete',
	templateUrl: './askdelete.component.html',
	styleUrls: ['./askdelete.component.scss']
})
export class AskDeleteDialogComponent {
	
	public onSubmit = new EventEmitter();
	
	public deleteDescription: string;

	constructor(
		private dialogRef: MatDialogRef<AskDeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		this.deleteDescription = data.deleteDescription;
	}
	
	public submit() {
		// Emit to parent
		this.onSubmit.emit(true);
		
		// Finally close dialog
		this.close();
	}

	public close() {
		this.dialogRef.close();
	}

}
