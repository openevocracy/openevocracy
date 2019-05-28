import { Component, OnInit } from '@angular/core';

import { HttpManagerService } from '../_services/http-manager.service';
import { UserService } from '../_services/user.service';
import { ActivityListService} from '../_services/activitylist.service';

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
	public activityList: Activity[];
	public faTrashAlt = faTrashAlt;
	public faPlus = faPlus;

	constructor(
		private userService: UserService,
		private httpManagerService: HttpManagerService,
		private activityListService: ActivityListService,
		private configService: ConfigService
	) {
		let userId = this.userService.getUserId();  // TODO: HAS TO BE CHANGED: NOT THIS USER BUT THE SELECTED ONE!
		console.log(userId);
		
		this.C = C;
		this.cfg = configService.get();

		this.httpManagerService.get('/json/user/profile/'+userId).subscribe(res => {
			// TODO currently only userId is contained in result, which is just to have a start,
			// it is intended to add more data later
			this.userId = res._id;
		});
	}
	
	ngOnInit() {
		// TODO load list
		//let act0 = new Activity({_id: "abfa33", user: "USER", type: 0, content: "Blabla", ts: "22.03.19, 17:30"});
		//console.log(act0)
		
		
		//this.activityList = [new Activity({_id: "abfa33", user: "USER", type: 3, content: "Blabla", ts: "22.03.19, 17:30"}), new Activity({_id: "abd323", user: "USER2", type: 1, content: "Blabla", ts: "22.03.19, 13:30"})];
		
		
		this.activityListService.getActivityList().subscribe(res => {
			// Sort activities by timestamp
			const sortedActivityList = _.sortBy(res, 'timestamp');
			
			// Initialize topicsList and construct all elements
			this.activityList = [];
			_.each(sortedActivityList, function(el) {
				this.activityList.push(new Activity(el));
			}.bind(this));
		});
	}
	
	/*
	 * @desc: Removes an activity
	 */
	remove(e, actId) {
		e.stopPropagation();
		
		this.activityListService.removeActivity(actId).subscribe(res => {
				if (res) // if deleting in database was successful
				{
					console.log("Deleting succesful");
					this.activityList = _.without(this.activityList, _.findWhere(this.activityList, {'_id': actId}));
				}
				else	
					console.log("Deleting not succesful");
				console.log(res);
			});
	}
	
	
	/*
	 * @desc: Adds an activity (for testing only)
	 */
	addActivity(e) {
		e.stopPropagation();
		this.activityListService.addActivity(C.ACT_MENTIONED, this.userId).subscribe(res => {

				if (res)
				{
					this.activityList.push(new Activity( 
      				{_id: res,
				      userId: this.userId,
					   type: C.ACT_MENTIONED,
					   targetId: this.userId} ));
				}
		});

	}


}
