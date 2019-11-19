import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
	selector: 'app-loginemail',
	templateUrl: './loginemail.component.html',
	styleUrls: ['./loginemail.component.scss']
})
export class LoginEmailDialogComponent implements OnInit {
	
	public onSubmit = new EventEmitter();
	public emailForm: FormGroup;

	constructor(
		private dialogRef: MatDialogRef<LoginEmailDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data
	) {
		// Define form group
		this.emailForm = new FormGroup({
			'email': new FormControl('', [Validators.required])
		});
		
		// Set email-address if email was injected
		if (this.data.email)
			this.emailForm.patchValue({ 'email': this.data.email });
	}
	
	ngOnInit() {}
	
	/**
	 * @desc: Close the dialog without doing anything
	 */
	public close() {
		this.dialogRef.close();
	}
	
	/**
	 * @desc: Get email and close dialog
	 */
	public submit() {
		// Check if form is valid
		if(!this.emailForm.valid)
			return;
		
		// Emit to parent
		this.onSubmit.emit({ 'email': this.emailForm.value.email });
		
		// Finally close dialog
		this.dialogRef.close();
	}

}
