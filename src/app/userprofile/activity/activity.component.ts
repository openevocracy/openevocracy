import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../_services/user.service';
import { ActivityListService} from '../../_services/activitylist.service';
import { ConfigService } from '../../_services/config.service';

import { Activity } from '../../_models/activity';

import { faUserLock, faUserFriends, faUsers, faGlobe } from '@fortawesome/free-solid-svg-icons';

import { C } from '../../../../shared/constants';
import * as _ from 'underscore';

@Component({
	selector: 'app-activity',
	templateUrl: './activity.component.html',
	styleUrls: ['./activity.component.scss']
})
export class UserprofileActivityComponent implements OnInit {
	
	public C;
	public cfg: any;
	
	public userId: string;
	public profileId: string;
	public activityList: Activity[];
	public activityCount: number;
	public defaultPageSize: number = 50;
	
	public faUserLock = faUserLock;
	public faUserFriends = faUserFriends;
	public faUsers = faUsers;
	public faGlobe = faGlobe;

	constructor(
		private userService: UserService,
		private activityListService: ActivityListService,
		private router: Router,
		private configService: ConfigService,
		private translate: TranslateService
	) {
		this.C = C;
		this.cfg = configService.get();
		
		this.userId = this.userService.getUserId();
		this.profileId = this.router.url.split('/')[3];
		
		console.log('profileId', this.profileId);
		
		// Get the count of the user's activities
		this.activityListService.getUserActivityListLength(this.profileId).subscribe(len => {
			this.activityCount = len;
		});
		
		// Load user activity list
		this.getActivityList(0, this.defaultPageSize);
	}
	
	ngOnInit() {
	}

	/**
	 * @desc: Reset privacy level of specific activity
	 */
	public setPrivacyLevel(e, privacyLevel) {
		console.log('privacyLevel', privacyLevel);
		// TODO: actually change the privacy level in the server
	}
	
	/**
	 * @desc: Called when paginator arrow (previous/next) is clicked
	 */
	public pageEvent(e) {
		// Get skip and limit from pageinator event
		const skip = e.pageIndex*e.pageSize;
		const limit = e.pageSize;
		
		// Get new activity list with skip and limit
		this.getActivityList(skip, limit);
	}
	
	/**
	 * @desc: Get activity list from server
	 */
	public getActivityList(skip, limit) {
		this.activityListService.getUserActivityList(this.profileId, skip, limit).subscribe(res => {
			// Sort activities by timestamp (inversely)
			const sortedActivityList = _.sortBy(res, 'timestamp').reverse();
			
			// Initialize activityList and construct all elements
			this.activityList = [];
			_.each(sortedActivityList, function(el) {
				this.activityList.push(new Activity(el));
			}.bind(this));
		});
	}
	
	/*
	 * @desc: Removes an activity
	 */
	/*remove(e, actId) {
		e.stopPropagation();
		
		this.activityListService.removeActivity(actId).subscribe(res => {
				if (res) // if deleting in database was successful
				{
					console.log("Deleting successful");
					this.activityList = _.without(this.activityList, _.findWhere(this.activityList, {'_id': actId}));
				}
				else	
					console.log("Deleting not successful");
				console.log(res);
			});
	}*/
}
