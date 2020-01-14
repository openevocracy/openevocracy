import { Component, OnInit, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
	selector: 'app-closeeditor',
	templateUrl: './closeeditor.component.html',
	styleUrls: ['./closeeditor.component.scss']
})
export class CloseEditorDialogComponent implements OnInit {
	
	public onSubmit = new EventEmitter();

	constructor(
		private dialogRef: MatDialogRef<CloseEditorDialogComponent>
	) { }
	
	ngOnInit() { }
	
	/**
	 * @desc: Sets response and closes dialog
	 */
	public setResponse(isLeave: boolean) {
		// Emit to parent
		this.onSubmit.emit({ 'isLeave': isLeave });
		
		// Finally close dialog
		this.dialogRef.close();
	}

}
