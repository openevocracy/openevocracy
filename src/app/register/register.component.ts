import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

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
		public user: UserService,
		private fb: FormBuilder,
		private alert: AlertService,
		private utilsService: UtilsService,
		private translate: TranslateService) {
		this.createForm();
	}
	
	ngOnInit() {}
	
	private createForm() {
		this.registerForm = this.fb.group({
			'email': ['', Validators.email],
			'passwords': this.fb.group({
				'password': ['', Validators.required],
				'passwordrep': ['', Validators.required]
			}, {validator: this.utilsService.areEqual})
		});
	}
	
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
		
		// Check login server side
		this.user.register(credentials)
			.subscribe(res => {
				// First clear old alerts
				this.alert.clear();
				
				// Alert result
				this.alert.alertFromServer(res.alert);
				
				// Enable button again
				this.awaitAuthentication = false;
			});
	}
	
}
