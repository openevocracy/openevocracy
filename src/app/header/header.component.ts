import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogConfig } from "@angular/material";

import { ShareDialogComponent } from '../dialogs/share/share.component';
import { FeedbackDialogComponent } from '../dialogs/feedback/feedback.component';

import { AlertService } from '../_services/alert.service';
import { UserService } from '../_services/user.service';
import { LanguageService } from '../_services/language.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { faCommentAlt, faGlobe, faCogs, faShareSquare } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	public userId: string;
	
	public faCommentAlt = faCommentAlt;
	public faGlobe = faGlobe;
	public faCogs = faCogs;
	public faShareSquare = faShareSquare;
	
	constructor(
		private dialog: MatDialog,
		private alertService: AlertService,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private userService: UserService,
		private languageService: LanguageService
	) {
		// Get user id from current user
		this.userId = this.userService.getUserId();
	}
	
	ngOnInit() {}
	
	/**
	 * @desc: Open feedback dialog
	 */
	public openFeedbackDialog() {
		const dialogConfig = new MatDialogConfig();
		
		dialogConfig.disableClose = true;
		dialogConfig.autoFocus = true;

		const dialogRef = this.dialog.open(FeedbackDialogComponent, {
			'minWidth': '500px'
		});
		
		dialogRef.afterClosed().subscribe(result => {
			if (!_.isUndefined(result) && result.trim() != "") {
		      // Get feedback content, send mail, close and show alert
				this.httpManagerService.post('/json/feedback', { 'feedback': result }).subscribe(res => {
					// Show alert
					this.alertService.alertFromServer(res.alert);
				});
			}
   	});
	}

	/**
	 * @desc: Change language in client and in database (settings of user)
	 */
	public setLanguage(key) {
		this.languageService.setLanguage(key);
	}
	
	/**
	 * @desc: Logout from evocracy
	 */
	public logout() {
		let self = this;
		
		// Call logout function in user service
		this.userService.logout();
	}
	
	/**
	 * @desc: Open share dialog
	 */
	public openShareDialog() {
		this.dialog.open(ShareDialogComponent);
	}
}
