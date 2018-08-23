import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from "@angular/material";

import { NewThreadDialogComponent } from '../dialogs/newthread/newthread.component';

import { UtilsService } from '../_services/utils.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { faComment, faUsers } from '@fortawesome/free-solid-svg-icons';

import * as _ from 'underscore';

@Component({
	selector: 'app-groupforum',
	templateUrl: './groupforum.component.html',
	styleUrls: ['./groupforum.component.scss']
})
export class GroupForumComponent implements OnInit {
	
	private forumId: string;
	private padId: string;
	private prefix: string;
	private title: string;
	
	// FontAwesome icons
	private faComment = faComment;
	private faUsers = faUsers;

	constructor(
		private utilsService: UtilsService,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private matDialog: MatDialog) {
	}
	
	ngOnInit() {
		this.activatedRoute.params.subscribe((params: Params) => {
			this.forumId = params.id;
			this.httpManagerService.get('/json/group/forum/' + this.forumId).subscribe(res => {
				this.padId = res.padId;
				this.title = res.title;
				
				let shortGroupId = this.utilsService.getShortId(res.groupId);
				this.translateService.get('FORUM_TITLE_PREFIX', {'id': shortGroupId}).subscribe(label => {
					this.prefix = label;
				});
			});
		});
	}
	
	private createNewThread() {
		let dialogRef = this.matDialog.open(NewThreadDialogComponent, {'minWidth': '600px'});
		dialogRef.componentInstance.onSubmit.subscribe(thread => {
			this.onSubmit(thread);
		});
	}
	
	private onSubmit(thread) {
		var data = _.extend(thread, { 'forumId': this.forumId });
		this.httpManagerService.post('/json/group/forum/thread/create', data).subscribe();
	}

}
