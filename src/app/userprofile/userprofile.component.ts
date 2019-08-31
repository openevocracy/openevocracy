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
import { faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';

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
	public faTrashAlt = faTrashAlt;
	public faPlus = faPlus;
	public header: string;

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
				
				// dummy activity list:
				// this.activityList = [new Activity({_id: "abfa33", user: "USER", type: 3, content: "Blabla", ts: "22.03.19, 17:30"}), new Activity({_id: "abd323", user: "USER2", type: 1, content: "Blabla", ts: "22.03.19, 13:30"})];
		
				// get activity list from server
				this.activityListService.getUserActivityList(this.profileId).subscribe(res => {
					// Sort activities by timestamp (inversely)
					const sortedActivityList = _.sortBy(res, 'timestamp').reverse();
					
					// Initialize activityList and construct all elements
					this.activityList = [];
					_.each(sortedActivityList, function(el) {
						this.activityList.push(new Activity(el));
					}.bind(this));
				});
				
				// choose appropriate headline
				if (this.userId == this.profileId) // headline for viewing own profile
				{
					this.translate.get("HEADER_MAINMENU_MY_PROFILE").
							subscribe(str => { this.header = str; });
				}	
				else // headline for viewing another user's profile
				{
					this.translate.get("HEADER_MAINMENU_USER_PROFILE").
							subscribe(str => { this.header = str; });
				}
			});
	}
	
	ngOnInit() {

	}
	
	/*
	 * @desc: Removes an activity
	 */
	remove(e, actId) {
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
	}
	
	
	/*
	 * @desc: Adds an activity (for testing only)
	 *
	addActivity(e) {
		e.stopPropagation();
		this.activityListService.addActivity(C.ACT_MENTIONED, this.userId).subscribe(res => {

				if (res)
				{
					this.activityList.push(new Activity(res.ops[0]));
				}
		});

	}*/


}
