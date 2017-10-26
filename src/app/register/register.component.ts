import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
	
	constructor(public user: UserService,
					private fb: FormBuilder,
					private alert: AlertService,
					private translate: TranslateService) {
		this.createForm();
	}
	
	ngOnInit() {
	}
	
	createForm() {
		this.registerForm = this.fb.group({
			email: ['', Validators.email],
			password: ['', Validators.required]
		});
	}
	
}
