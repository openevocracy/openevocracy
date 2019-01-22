import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogConfig } from "@angular/material";

import { AlertService } from '../_services/alert.service';
import { UserService } from '../_services/user.service';
import { LanguageService } from '../_services/language.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faCogs } from '@fortawesome/free-solid-svg-icons';

import { FeedbackDialogComponent } from '../dialogs/feedback/feedback.component';

import * as _ from 'underscore';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
	
	public uid: string;
	
	public faCommentAlt = faCommentAlt;
	public faGlobe = faGlobe;
	public faCogs = faCogs;
	
	constructor(
		private dialog: MatDialog,
		private alertService: AlertService,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private userService: UserService,
		private languageService: LanguageService) {
		
		this.uid = this.userService.getUserId();
	}
	
	ngOnInit() {}
	
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

	public setLanguage(key) {
		this.languageService.setLanguage(key);
	}
	
	public logout() {
		let self = this;
		
		// Call logout function in user service
		this.userService.logout();
	}
}
