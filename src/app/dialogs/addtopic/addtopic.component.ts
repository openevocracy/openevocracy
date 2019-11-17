import { Component, OnInit, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ConfigService } from '../../_services/config.service';

@Component({
	selector: 'app-addtopic',
	templateUrl: './addtopic.component.html',
	styleUrls: ['./addtopic.component.scss']
})
export class AddtopicDialogComponent implements OnInit {
	
	public onSubmit = new EventEmitter();
	
	public addTopicForm: FormGroup;
	
	public minLetters: number;

	constructor(
		private dialogRef: MatDialogRef<AddtopicDialogComponent>,
		private configService: ConfigService
		) {
		// Get minimum number of letters for topic title from config
		const cfg = configService.get();
		this.minLetters = cfg.MIN_LETTERS_TOPIC_NAME;
		
		// Define form group
		this.addTopicForm = new FormGroup({
			'topicName': new FormControl('', [Validators.required, Validators.minLength(this.minLetters)])
		});
	}
	
	ngOnInit() { }
	
	/**
	 * @desc: Close the dialog without doing anything
	 */
	public close() {
		this.dialogRef.close();
	}
	
	/**
	 * @desc: Get topic name and close dialog
	 */
	public submit() {
		// Check if form is valid
		if(!this.addTopicForm.valid)
			return;
		
		// Emit to parent
		this.onSubmit.emit({ 'topicName': this.addTopicForm.value.topicName });
		
		// Finally close dialog
		this.dialogRef.close();
	}

}
