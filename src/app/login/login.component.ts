import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';

import { ModalService } from '../_services/modal.service';
import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { PwforgetService } from '../_services/pwforget.service';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
	
	private loginForm: FormGroup;
	private pwforgetSubscription: Subscription;

	constructor(
		public router: Router,
		public user: UserService,
		private fb: FormBuilder,
		private alert: AlertService,
		private modal: ModalService,
		private translate: TranslateService,
		private pwforgetService: PwforgetService) {
			
		this.createForm();
		this.pwforgetSubscription = this.pwforgetService.getEmail().subscribe(email => {
			// Do POST request to server and evaluate result
			this.alert.success("Es wurde eine E-Mail an die E-Mail-Adresse " + email + " gesendet."); // Just for testing purpose
			
			// If response is positive, show success alert
			/* TODO
			this.translate.get(res).subscribe((trans: string) => {
				this.alert.error(trans);
			});*/
			
			// if response is negative, show error alert
			/* TODO
			this.translate.get(res).subscribe((trans: string) => {
				this.alert.success(trans);
			});*/
			
		});
	}
	
	ngOnInit() {
	}
	
	ngOnDestroy() {
		// Unsubscribe to avoid memory leak
		this.pwforgetSubscription.unsubscribe();
	}
	
	private createForm() {
		this.loginForm = this.fb.group({
			email: ['', Validators.email],
			password: ['', Validators.required]
		});
	}
	
	private handleLogin(res) {
		console.log(res);
		
		/*if(res === true) {
            //this.router.navigate(['/']);
        } else {
            this.error = 'Username or password is incorrect';
            this.loading = false;
        }*/
			
		// Check response
		//if(this.authenticated) {
			// # If 200 ok: Go on ..
		
			
		//} else {
			// # If not: Show alert component, where error message is in response (res) from server
			/*this.translate.get(res).subscribe((trans: string) => {
				this.alert.error(trans);
			});*/
		//}
	}
	
	private onSubmit() {
		// Set login status to true (login)
		//this.user.setLoginStatus(true);
		
		// Redirect to any page after login
		//this.router.navigate(['/topics']);
		
		// If form is valid, go for login
		if(this.loginForm.valid) {
			// Check login server side
			this.user.authenticate({
				'email': this.loginForm.value.email,
				'password': this.loginForm.value.password
			}).subscribe(res => this.handleLogin(res));
		}
	}
	
	private passwordForget(e) {
		e.preventDefault();
		this.modal.open({email: this.loginForm.value.email});
	}
	
}
