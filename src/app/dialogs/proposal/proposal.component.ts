import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'app-proposal',
	templateUrl: './proposal.component.html',
	styleUrls: ['./proposal.component.scss']
})
export class ProposalDialogComponent implements OnInit {

	constructor(
		private dialogRef: MatDialogRef<ProposalDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) { }
	
	ngOnInit() { }
	
	public close() {
		this.dialogRef.close();
	}

}
