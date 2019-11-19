import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from "@angular/material";

import { UserService } from '../_services/user.service';
import { AlertService } from '../_services/alert.service';
import { HttpManagerService } from '../_services/http-manager.service';
import { LanguageService } from '../_services/language.service';

import { LoginEmailDialogComponent } from '../dialogs/loginemail/loginemail.component';

import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';
import * as $ from 'jquery';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
	
	public loginForm: FormGroup;
	public awaitAuthentication: boolean = false;
	private lastAlertKey: string;

	private faSpinner = faSpinner;

	constructor(
		public userService: UserService,
		private dialog: MatDialog,
		private fb: FormBuilder,
		private alertService: AlertService,
		private httpManagerService: HttpManagerService,
		private languageService: LanguageService,
		private activatedRoute: ActivatedRoute
	) {	
		// Create form
		this.loginForm = this.fb.group({
			email: ['', Validators.email],
			password: ['', Validators.required]
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
	
	/**
	 * @desc: Called when login form is submitted
	 */
	public onSubmit() {
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
		
		// Check login server side and handle login
		this.userService.authenticate(credentials).subscribe(res => {
			// Initalize language for fresh logged in user
			this.languageService.setClientLanguage();
		}, err => {
			console.log(err);
			// Store alert.content to direct link, if alert contains one
			this.lastAlertKey = err.error.alert.content;
			
			// Set alert message
			this.alertService.alertFromServer(err.error.alert);
			
			// Enable button again
			this.awaitAuthentication = false;
		});
	}
	
	/**
	 * @desc: Handles the dialog for requesting a new password
	 */
	private openRequestPasswordDialog(email) {
		const options = {
			'data': { 'email': email, 'title': 'DIALOG_REQUEST_NEW_PASSWORD' },
			'minWidth': '400px'
		};
		const dialogRef = this.dialog.open(LoginEmailDialogComponent, options);
		
		// After email dialog was submitted, request new password
		dialogRef.componentInstance.onSubmit.subscribe((res) => {
			const email = res.email;
			
			// Request new password
			this.userService.sendNewPassword(email).subscribe(res => {
				// First clear old alerts
				this.alertService.clear();
				// Show alert message from server
				this.alertService.alertFromServer(res.alert);
			});
		});
	}
	
	/**
	 * @desc: Handles the dialog for re-sending the verification email
	 */
	private openSendVerificationAgainDialog(email) {
		const options = {
			'data': { 'email': email, 'title': 'DIALOG_SEND_VERIFICATION_MAIL_AGAIN' },
			'minWidth': '400px'
		};
		const dialogRef = this.dialog.open(LoginEmailDialogComponent, options);
		
		// After email dialog was submitted, request re-sending verification mail
		dialogRef.componentInstance.onSubmit.subscribe((res) => {
			const email = res.email;
			
			// Re-send verification email
			this.userService.sendVerificationMailAgain(email).subscribe(res => {
				// First clear old alerts
				this.alertService.clear();
				// Show alert message from server
				this.alertService.alertFromServer(res.alert);
			});
		});
	}
	
	private evaluateLink(e) {
		// Get mail, send from server (given in href of link)
		const email = $(e.target).attr('href');
		
		const key = this.lastAlertKey;
		
		if(key == "USER_ACCOUNT_NOT_VERIFIED") {
			this.openSendVerificationAgainDialog(email);
			return;
		}
		
		if(key == "USER_PASSWORT_NOT_CORRECT") {
			this.openRequestPasswordDialog(email);
			return;
		}
		
	}
	
	public passwordForget(e) {
		// Prevent default click behavior
		e.preventDefault();
		
		// Open dialog to request new password
		this.openRequestPasswordDialog(this.loginForm.value.email);
	}
	
	private startMutationObserver() {
		const self = this;
		
		// Define node which should be observed
		const node = document.querySelector('alert');
		
		// Define mutation observer and check if alert was added
		// if an added alert includes a link, add a click event to it
		const observer = new MutationObserver((mutations) => {
			// Get mutation of type "childList" (child element was added)
			const mutation = _.findWhere(mutations, { type: "childList" });
			
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
