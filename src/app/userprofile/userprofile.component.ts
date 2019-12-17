import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ActivityListService} from '../_services/activitylist.service';

import { TranslateService } from '@ngx-translate/core';

import { C } from '../../../shared/constants';
//import { cfg } from '../../../shared/config';
import { ConfigService } from '../_services/config.service';
import { Activity } from '../_models/activity';
import * as _ from 'underscore';
import { faUserLock, faUserFriends, faUsers, faGlobe } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-userprofile',
	templateUrl: './userprofile.component.html',
	styleUrls: ['./userprofile.component.scss'],
   providers: [ActivityListService]
})
export class UserprofileComponent implements OnInit {

	public C;
	public cfg: any;
	public userId: string;
	public profileId: string;
	public activityList: Activity[];
	public header: string;
	
	public defaultPageSize: number = 50;
	
	public faUserLock = faUserLock;
	public faUserFriends = faUserFriends;
	public faUsers = faUsers;
	public faGlobe = faGlobe;
	
	public activityCount: number;

	constructor(
		private userService: UserService,
		private httpManagerService: HttpManagerService,
		private activityListService: ActivityListService,
		private activatedRoute: ActivatedRoute,
		private configService: ConfigService,
		private translate: TranslateService
	) {
		this.userId = this.userService.getUserId(); 
		
		this.C = C;
		this.cfg = configService.get();
		
		this.activatedRoute.params.subscribe(
			(params: Params) => {
				this.profileId = params['id'];
				
				// Create dummy activity list for this component
				// this.activityList = [new Activity({_id: "abfa33", user: "USER", type: 3, content: "Blabla", ts: "22.03.19, 17:30"}), new Activity({_id: "abd323", user: "USER2", type: 1, content: "Blabla", ts: "22.03.19, 13:30"})];
		
				// Add dummy activities to the database
				//this.activityListService.addActivity(1, "<nnnnnnnnnn>").subscribe(res => {});
				//this.activityListService.addActivity(2, "<nnnnnnnnnn>").subscribe(res => {});
				
				// Get the count of the user's activities
				this.activityListService.getUserActivityListLength(this.profileId).subscribe(len => {
					this.activityCount = len;
				});
				
				// Load user activity list
				this.getActivityList(0, this.defaultPageSize);
				
				// Choose appropriate headline
				// Headline for viewing own profile
				if (this.userId == this.profileId) {
					this.translate.get("HEADER_MAINMENU_MY_PROFILE").
							subscribe(str => { this.header = str; });
				}
				// Headline for viewing another user's profile
				else {
					this.translate.get("HEADER_MAINMENU_USER_PROFILE").
							subscribe(str => { this.header = str; });
				}
			});
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
