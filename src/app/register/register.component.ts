import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '../_services/utils.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  
	public registerForm: FormGroup;
	private awaitAuthentication: boolean = false;
	
	constructor(
		public userService: UserService,
		private fb: FormBuilder,
		private alertService: AlertService,
		private utilsService: UtilsService,
		private translate: TranslateService
	) {
		// Create register form
		this.registerForm = this.fb.group({
			'email': ['', Validators.email],
			'passwords': this.fb.group({
				'password': ['', Validators.required],
				'passwordrep': ['', Validators.required]
			}, { validator: this.utilsService.areEqual })
		});
	}
	
	ngOnInit() {}
	
	/**
	 * @desc: Called when register form is submitted
	 */
	public onSubmit() {
		// If form is not valid, break registration
		if(!this.registerForm.valid)
			return;
		
		// Disable button
		this.awaitAuthentication = true;
		
		// Read credentials from form
		var credentials = {
			'email': this.registerForm.value.email,
			'password': this.registerForm.value.passwords.password
		};
		
		// Check registering server side
		this.userService.register(credentials).subscribe(res => {
			console.log(res);
			// First clear old alerts
			this.alertService.clear();
			// Alert result
			this.alertService.alertFromServer(res.alert);
			// Enable button again
			this.awaitAuthentication = false;
		}, err => {
			// First clear old alerts
			this.alertService.clear();
			// Set alert message
			this.alertService.alertFromServer(err.error.alert);
			// Enable button again
			this.awaitAuthentication = false;
		});
	}
	
}
