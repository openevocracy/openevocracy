import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';

import { ModalService } from '../_services/modal.service';
import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { HttpManagerService } from '../_services/http-manager.service';
import { EmailModalService } from '../_services/modal.email.service';
import { LanguageService } from '../_services/language.service';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';

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

	private faSpinner = faSpinner;

	constructor(
		public userService: UserService,
		private fb: FormBuilder,
		private alertService: AlertService,
		private modalService: ModalService,
		private httpManagerService: HttpManagerService,
		private languageService: LanguageService,
		private activatedRoute: ActivatedRoute,
		private emailModalService: EmailModalService) {
			
		this.createForm();
		
		this.modalSubscription = this.emailModalService.getEmail().subscribe(email => {
			// First clear old alerts
			this.alertService.clear();
			
			var key = this.lastAlertKey;
			
			if(key == "USER_ACCOUNT_NOT_VERIFIED") {
				this.userService.sendVerificationMailAgain(email).subscribe(res => {
					this.alertService.alertFromServer(res.alert);
				});
			}
			
			if(key == "USER_PASSWORT_NOT_CORRECT") {
				this.userService.sendNewPassword(email).subscribe(res => {
					this.alertService.alertFromServer(res.alert);
				});
			}
			
		});
	}
	
	ngOnInit() {
		var self = this;
		
		// Start mutation observer to check if alert was added
		this.startMutationObserver();
		
		// Get query from URL to check if verification key was transmitted
		this.activatedRoute.queryParams.subscribe(params => {
			// Only go on if parameters 'v' (verification key) and 'm' (email) exist
			if(!_.has(params, 'v') && !_.has(params, 'm'))
				return;
				
			// Send verification to server and check
			this.userService.verifyEmail(params.v).subscribe(res => {
				
				// Set email form field to email from parameter
				this.loginForm.patchValue({'email': params.m});
				
				// Set alert message
				this.alertService.alertFromServer(res.alert);
			});
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
		// If form is not valid, return
		if(!this.loginForm.valid)
			return;
			
		// Disable button
		this.awaitAuthentication = true;
		
		// Read credentials from form
		var credentials = {
			'email': this.loginForm.value.email,
			'password': this.loginForm.value.password
		};
		
		var self = this;
		// Check login server side and handle login
		this.userService.authenticate(credentials)
			.subscribe(res => {
				// Initalize language for fresh logged in user
				this.languageService.setClientLanguage();
			}, error => {
				// Store alert.content to direct link, if alert contains one
				self.lastAlertKey = error.alert.content;
				
				// Enable button again
				self.awaitAuthentication = false;
		});
	}
	
	private evaluateLink(e) {
		// Get mail, send from server (given in href of link)
		var email = $(e.target).attr('href');
		
		var key = this.lastAlertKey;
		
		if(key == "USER_ACCOUNT_NOT_VERIFIED") {
			this.modalService.open({'email': email, 'title': 'MODAL_SEND_VERIFICATION_MAIL_AGAIN'});
			return;
		}
		
		if(key == "USER_PASSWORT_NOT_CORRECT") {
			this.modalService.open({'email': email, 'title': 'MODAL_REQUEST_NEW_PASSWORD'});
			return;
		}
		
	}
	
	private passwordForget(e) {
		// Prevent default click behavior
		e.preventDefault();
		
		// Fake lastAlertKey to get correct evaluation after form submit
		this.lastAlertKey = "USER_PASSWORT_NOT_CORRECT"
		
		// Open modal with proper title
		this.modalService.open({'email': '', 'title': 'MODAL_REQUEST_NEW_PASSWORD'});
	}
	
	private startMutationObserver() {
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
	
}
