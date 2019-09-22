import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from '../../_services/user.service';
import { HttpManagerService } from '../../_services/http-manager.service';

import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { faUser, faUsers, faCaretDown, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-members',
	templateUrl: './members.component.html',
	styleUrls: ['../group.component.scss', './members.component.scss']
})
export class GroupMembersComponent implements OnInit {

	public C = C;
	public userId;
	public groupId;
	public chosenMemberId;
	public membersArray;
	public members = {};
	public isLastGroup;
	
	public faUser = faUser;
	public faUsers = faUsers;
	public faCaretDown = faCaretDown;
	public faInfoCircle = faInfoCircle;

	constructor(
		private router: Router,
		private userService: UserService,
		private httpManagerService: HttpManagerService
	) {
		// Get user id from user service
		this.userId = this.userService.getUserId();
		
		// Initiliaze chosenMemberId with userId of current user
		this.chosenMemberId = this.userId;
	}
	
	ngOnInit() {
		// Get current groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Get members
		this.httpManagerService.get('/json/group/members/' + this.groupId).subscribe((res) => {
			
			// Define members as object, where keys are userIds
			this.membersArray = res.members;
			_.each(this.membersArray, (member) => {
				this.members[member.userId] = member;
			});
			
			// If group is last group, don't show ratings
			this.isLastGroup = res.isLastGroup;
			
			console.log(res);
		});
	}
	
	/**
	 * @desc: When user chooses another member, switch view data to chosen member
	 */
	private chooseMember(userId) {
		this.chosenMemberId = userId;
	}
	
	/**
	 * @desc: When a user choses a star, store new value locally and on server
	 */
	private onRate(e) {
		// Post rating to server
		this.postRating(e.ratingId, e.ratingValue);
		
		// Update members local rating values
		switch(e.ratingId) {
			case C.RATING_INTEGRATION:
				this.members[this.chosenMemberId].ratingIntegration = e.ratingValue; break;
			case C.RATING_KNOWLEDGE: 
				this.members[this.chosenMemberId].ratingKnowledge = e.ratingValue; break;
			//case C.RATING_ENGAGEMENT: this.members[this.chosenMemberId].ratingIntegration = e.ratingValue; break;
		}
	}
	
	/*
	 * @desc: Posts rating of user to server
	 *
	 * @params:
	 *    ratingId:    type of rating (integration, knowledge, effort)
	 *    ratingValue: value of rating (1 to 5)
	 */
	private postRating(ratingId, ratingValue) {
		// Do not post new rating to server, if the new rating is equal to the old rating
		const ratedMember = this.members[this.chosenMemberId];
		if(ratingId == C.RATING_INTEGRATION && ratedMember.ratingIntegration == ratingValue)
			return;
		if(ratingId == C.RATING_KNOWLEDGE && ratedMember.ratingKnowledge == ratingValue)	
			return;
		/*if(ratingId == C.RATING_ENGAGEMENT && ratedMember.ratingEngagement == ratingValue)	
			return;*/
			
		// Post rating to server
		const rating = { 'groupId': this.groupId, 'ratedUserId': this.chosenMemberId, 'score': ratingValue, 'type': ratingId };
		this.httpManagerService.post('/json/ratings/rate', rating).subscribe();
	}

}
