import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlertService } from '../_services/alert.service';
import { UtilsService } from '../_services/utils.service';
import { UserService } from '../_services/user.service';
import { SettingsService } from '../_services/settings.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { faSave } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
	
	private settingsForm: FormGroup;
	
	private faSave = faSave;
	
	private uid: string;
	
	constructor(
		private fb: FormBuilder,
		private utilsService: UtilsService,
		private userService: UserService,
		private alert: AlertService,
		private httpManagerService: HttpManagerService) {
		this.createForm();
	}
	
	ngOnInit() {
		// Get user id from user service
		this.uid = this.userService.getUserId();
		
		this.httpManagerService.get('/json/user/settings/' + this.uid)
			.subscribe(res => {
			// Set email field
			this.settingsForm.patchValue({'email': res.email });
		});
	}
	
	private createForm() {
		this.settingsForm = this.fb.group({
			'email': ['', Validators.email],
			'passwords': this.fb.group({
				'password': ['', Validators.required],
				'passwordrep': ['', Validators.required]
			}, {validator: this.utilsService.areEqual})
		});
	}
	
	private submitForm() {
		// Patch user account
		
		/*this.httpManagerService.patch('/json/user/settings/' + this.uid, {})
			.subscribe(res => {
				console.log(succesfully patched);
			});*/
	}

}
