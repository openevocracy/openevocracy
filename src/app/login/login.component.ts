import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

import { ModalService } from '../_services/modal.service';
import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { PwforgetService } from '../_services/pwforget.service';

import * as _ from 'underscore';
import * as $ from 'jquery';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
	private loginForm: FormGroup;
	private pwforgetSubscription: Subscription;
	private awaitAuthentication: boolean = false;

	constructor(
		public user: UserService,
		private fb: FormBuilder,
		private alert: AlertService,
		private modal: ModalService,
		private translate: TranslateService,
		private pwforgetService: PwforgetService) {
			
		this.createForm();
		
		this.pwforgetSubscription = this.pwforgetService.getEmail().subscribe(email => {
			// First clear old alerts
			this.alert.clear();
			
			this.user.sendVerificationMailAgain(email).subscribe(res => {
				console.log('result');
				this.translate.get(res.alert.content, res.alert.vars).subscribe(str => {
					this.alert.alert(res.alert.type, str);
				});
			});
			
		});
	}
	
	ngOnInit() {
		var self = this;
		
		// Define node which should be observed
		var node = document.querySelector('alert');
		
		// Define mutation observer
		var observer = new MutationObserver((mutations) => {
			// Get mutation of type "childList" (child element was added)
			var mutation = _.findWhere(mutations, { type: "childList" });
			// Add click event to link
			$(mutation.addedNodes).find('a').on('click', function(e) {
				// Prevent default click behavior
				e.preventDefault();
				
				// Call password forget function
				self.passwordForget(e);
			});
		});
		
		// Start observing if a child tag is added
		observer.observe(node, {
			childList: true
		});
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
	
	private onSubmit() {
		// If form is valid, go for login
		if(this.loginForm.valid) {
			// Disable button
			this.awaitAuthentication = true;
			
			// Read credentials from form
			var credentials = {
				'email': this.loginForm.value.email,
				'password': this.loginForm.value.password
			};
			
			var self = this;
			// Check login server side and handle login
			this.user.authenticate(credentials)
				.subscribe(res => {
					console.log('login.component');
					
				}, error => {
					// Enable button again
					self.awaitAuthentication = false;
				});
		}
	}
	
	private passwordForget(e) {
		// Get mail, send from server
		var email = $(e.target).attr('href');
		
		// Open modal
		this.modal.open({email: email});
	}
	
}
