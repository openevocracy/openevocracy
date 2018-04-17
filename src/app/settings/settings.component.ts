import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlertService } from '../_services/alert.service';
import { UtilsService } from '../_services/utils.service';
import { SettingsService } from '../_services/settings.service';

import { faSave } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
	
	private settingsForm: FormGroup;
	
	private faSave = faSave;
	
	constructor(
		private fb: FormBuilder,
		private utilsService: UtilsService,
		private alert: AlertService) {
		this.createForm();
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
	
	ngOnInit() {
		// Get email ...
	}

}
