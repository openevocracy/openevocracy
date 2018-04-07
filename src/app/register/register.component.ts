import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  
	private registerForm: FormGroup;
	private awaitAuthentication: boolean = false;
	
	constructor(
		public router: Router,
		public user: UserService,
		private fb: FormBuilder,
		private alert: AlertService,
		private translate: TranslateService) {
		this.createForm();
	}
	
	// from https://stackoverflow.com/questions/35474991/angular-2-form-validating-for-repeat-password
	areEqual(c: AbstractControl): ValidationErrors | null {
		const keys: string[] = Object.keys(c.value);
		for (const i in keys) {
			if (i !== '0' && c.value[ keys[ +i - 1 ] ] !== c.value[ keys[ i ] ]) {
				return { areEqual: true };
			}
		}
	}
	
	ngOnInit() {}
	
	createForm() {
		this.registerForm = this.fb.group({
			'email': ['', Validators.email],
			'passwords': this.fb.group({
				'password': ['', Validators.required],
				'passwordrep': ['', Validators.required]
			}, {validator: this.areEqual})
		});
	}
	
	private onSubmit() {
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
				this.alert.alertFromServer(res.alert);
				
				// Enable button again
				this.awaitAuthentication = false;
			});
	}
	
}
