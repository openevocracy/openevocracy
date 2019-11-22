import { Component, OnInit } from '@angular/core';
import { trigger, style, animate, transition, state } from '@angular/animations';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { UserService } from '../../_services/user.service';
import { GroupService } from '../../_services/group.service';
import { HttpManagerService } from '../../_services/http-manager.service';

import * as _ from 'underscore';

import { C } from '../../../../shared/constants';

import { faUser, faUsers, faCaretDown, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-members',
	templateUrl: './members.component.html',
	styleUrls: ['../group.component.scss', './members.component.scss'],
	animations: [ trigger('animation', [
			state('show', style({ 'opacity': '1' })),
			state('hide', style({ 'opacity': '0' })),
			transition('show=>hide', animate('300ms ease-out')),
			transition('hide=>show', animate('300ms ease-in'))
		])
	]
})
export class GroupMembersComponent implements OnInit {

	public C = C;
	public userId;
	public groupId;
	public chosenMemberId;
	public memberArray;
	public members = {};
	public isLastGroup;
	public animationState = 'show';
	
	public faUser = faUser;
	public faUsers = faUsers;
	public faCaretDown = faCaretDown;
	public faInfoCircle = faInfoCircle;
	
	public ratingLabels = [
		{ 'type': C.RATING_KNOWLEDGE, 'label': 'GROUP_RATING_KNOWLEDGE', 'tooltip': 'GROUP_RATING_TOOLTIP_KNOWLEDGE' },
		{ 'type': C.RATING_COOPERATION, 'label': 'GROUP_RATING_COOPERATION', 'tooltip': 'GROUP_RATING_TOOLTIP_COOPERATION' },
		{ 'type': C.RATING_ENGAGEMENT, 'label': 'GROUP_RATING_ENGAGEMENT', 'tooltip': 'GROUP_RATING_TOOLTIP_ENGAGEMENT' }
	];

	constructor(
		private router: Router,
		private userService: UserService,
		private groupService: GroupService,
		private httpManagerService: HttpManagerService
	) {
		// Get user id from user service
		this.userId = this.userService.getUserId();
		
		// Initialize chosenMemberId with userId of current user
		this.chosenMemberId = this.userId;
	}
	
	ngOnInit() {
		// Get current groupId
		this.groupId = this.router.url.split('/')[2];
		
		// Get basic group information and extend by member ratings
		this.groupService.getMembersRatings(this.groupId).subscribe((membersRatings) => {
			
			// Get group from group service cache
			const group = this.groupService.getBasicGroupFromCache(this.groupId);
			
			// Get array of member ids
			this.memberArray = group.members;
			
			// Define members as object, where keys are userIds and add labels to rating
			_.each(this.memberArray, (member) => {
				// Get ratings for current member
				const memberRatings = _.findWhere(membersRatings, { 'ratedUserId': member.userId });
				
				// Add label and tooltip to ratings array
				member.ratings = _.map(memberRatings.ratings, (rating) => {
					const labels = _.findWhere(this.ratingLabels, { 'type': rating.type });
					return _.extend(rating, labels);
				});
				// Define members as object, key is userId
				this.members[member.userId] = member;
			});
			
			// If group is last group, don't show ratings
			this.isLastGroup = group.isLastGroup;
		});
	}
	
	/**
	 * @desc: When user chooses another member, switch view data to chosen member
	 */
	private chooseMember(userId) {
		// First hide content
		this.animationState = 'hide';
		setTimeout(() => {
			// Change member
			this.chosenMemberId = userId;
			//Show content
			this.animationState = 'show';
		}, 300);
	}
	
	/**
	 * @desc: When a user choses a star, store new value locally and on server
	 */
	private onRate(e) {
		// Get rating from rated member
		const memberRatings = this.members[this.chosenMemberId].ratings;
		let rating = _.findWhere(memberRatings, { 'type': e.ratingId });
		
		// Check if anything has changed, if not: stop evalulation
		if (rating.score == e.ratingValue)
			return;
		
		// Update rating in local members array
		rating.score = e.ratingValue;
		
		// Post rating to server
		this.postRating(e.ratingId, e.ratingValue);
	}
	
	/*
	 * @desc: Posts rating of user to server
	 *
	 * @params:
	 *    ratingId:    type of rating (integration, knowledge, effort)
	 *    ratingValue: value of rating (1 to 5)
	 */
	private postRating(ratingId, ratingValue) {
		// Post rating to server
		const rating = { 'groupId': this.groupId, 'ratedUserId': this.chosenMemberId, 'score': ratingValue, 'type': ratingId };
		this.httpManagerService.post('/json/ratings/rate', rating).subscribe();
	}

}
