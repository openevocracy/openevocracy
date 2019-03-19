import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  'deleteDescription': string;
}

@Component({
	selector: 'app-askdelete',
	templateUrl: './askdelete.component.html',
	styleUrls: ['./askdelete.component.scss']
})
export class AskDeleteDialogComponent implements OnInit {
	
	public deleteDescription: string;

	constructor(
		private dialogRef: MatDialogRef<AskDeleteDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: DialogData
	) {
		this.deleteDescription = data.deleteDescription;
	}
	
	ngOnInit() {
	}
	
	public submit() {
		console.log('send http request to delete');
	}

	public close() {
		this.dialogRef.close();
	}

}
