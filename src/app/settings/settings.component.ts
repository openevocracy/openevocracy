import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlertService } from '../_services/alert.service';
import { UtilsService } from '../_services/utils.service';
import { UserService } from '../_services/user.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { faSave } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
	
	public uid: string;
	public settingsForm: FormGroup;
	public disableButton: boolean = true;
	public showSpinner: boolean = false;
	
	public faSave = faSave;
	public faSpinner = faSpinner;
	
	constructor(
		private fb: FormBuilder,
		private utilsService: UtilsService,
		private userService: UserService,
		private alertService: AlertService,
		private httpManagerService: HttpManagerService) {
		this.createForm();
	}
	
	ngOnInit() {
		// Get user id from user service
		this.uid = this.userService.getUserId();
		
		// Prefill form
		this.getFormData();
		
		this.settingsForm.valueChanges.subscribe(value => {
			if(this.settingsForm.dirty)
				this.disableButton = false;
		});
	}
	
	private createForm() {
		this.settingsForm = this.fb.group({
			'email': ['', Validators.email],
			'passwords': this.fb.group({
				'password': [''],
				'passwordrep': ['']
			}, {validator: this.utilsService.areEqual})
		});
	}
	
	private getFormData() {
		this.httpManagerService.get('/json/user/settings/' + this.uid)
			.subscribe(res => {
			// Set email field
			this.settingsForm.patchValue({'email': res.email });
		});
	}
	
	public onSubmit() {
		// If form is valid and dirty, go for login
		if(!(this.settingsForm.valid && this.settingsForm.dirty))
			return;
		
		// Disable button
		this.disableButton = true;
		this.showSpinner = true;
		
		// Read account field values from form
		let accountUpdate: any = {};
		if(this.settingsForm.value.email)
			accountUpdate.email = this.settingsForm.value.email
		if(this.settingsForm.value.passwords.password)
			accountUpdate.password = this.settingsForm.value.passwords.password
		
		// Send account changes to server
		this.httpManagerService.patch('/json/user/settings/' + this.uid, accountUpdate)
			.subscribe(res => {
				// Reset form and load account data from server again
				this.settingsForm.reset();
				this.getFormData();
				
				// Disable spinner
				this.showSpinner = false;
				
				// Show alert
				this.alertService.alertFromServer(res.alert);
			});
	}
		
			
}
