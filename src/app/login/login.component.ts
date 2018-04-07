import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

import { ModalService } from '../_services/modal.service';
import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';
import { EmailModalService } from '../_services/modal.email.service';

import * as _ from 'underscore';
import * as $ from 'jquery';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
	private loginForm: FormGroup;
	private modalSubscription: Subscription;
	private awaitAuthentication: boolean = false;
	private lastAlertKey: string;

	constructor(
		public user: UserService,
		private fb: FormBuilder,
		private alert: AlertService,
		private modal: ModalService,
		private translate: TranslateService,
		private emailModalService: EmailModalService) {
			
		this.createForm();
		
		this.modalSubscription = this.emailModalService.getEmail().subscribe(email => {
			// First clear old alerts
			this.alert.clear();
			
			console.log('ok1');
			
			var key = this.lastAlertKey;
			
			if(key == "USER_ACCOUNT_NOT_VERIFIED") {
				this.user.sendVerificationMailAgain(email).subscribe(res => {
					this.alert.alertFromServer(res.alert);
				});
			}
			
			if(key == "USER_PASSWORT_NOT_CORRECT") {
				console.log('ok2');
				this.user.sendNewPassword(email).subscribe(res => {
					this.alert.alertFromServer(res.alert);
				});
				return;
			}
			
		});
	}
	
	ngOnInit() {
		var self = this;
		
		// Define node which should be observed
		var node = document.querySelector('alert');
		
		// Define mutation observer and check if alert was added
		// if an added alert includes a link, add a click event to it
		var observer = new MutationObserver((mutations) => {
			// Get mutation of type "childList" (child element was added)
			var mutation = _.findWhere(mutations, { type: "childList" });
			
			// Add click event to link
			$(mutation.addedNodes).find('a').on('click', function(e) {
				// Prevent default click behavior
				e.preventDefault();
				
				// Call evaluation function
				self.evaluateLink(e);
			});
		});
		
		// Start observing if a child tag is added
		observer.observe(node, {
			childList: true
		});
	}
	
	ngOnDestroy() {
		// Unsubscribe to avoid memory leak
		this.modalSubscription.unsubscribe();
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
				.subscribe(res => {}, error => {
					// Store alert.content to direct link, if alert contains one
					self.lastAlertKey = error.alert.content;
					
					// Enable button again
					self.awaitAuthentication = false;
				});
		}
	}
	
	private evaluateLink(e) {
		// Get mail, send from server (given in href of link)
		var email = $(e.target).attr('href');
		
		var key = this.lastAlertKey;
		
		if(key == "USER_ACCOUNT_NOT_VERIFIED") {
			this.modal.open({'email': email, 'title': 'MODAL_SEND_VERIFICATION_MAIL_AGAIN'});
			return;
		}
		
		if(key == "USER_PASSWORT_NOT_CORRECT") {
			this.modal.open({'email': email, 'title': 'MODAL_REQUEST_NEW_PASSWORD'});
			return;
		}
		
	}
	
	private passwordForget(e) {
		// Prevent default click behavior
		e.preventDefault();
		
		// Fake lastAlertKey to get correct evaluation after form submit
		this.lastAlertKey = "USER_PASSWORT_NOT_CORRECT"
		
		// Open modal with proper title
		this.modal.open({'email': '', 'title': 'MODAL_REQUEST_NEW_PASSWORD'});
	}
	
}
