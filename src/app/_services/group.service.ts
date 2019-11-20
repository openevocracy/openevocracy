import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

import { HttpManagerService } from './http-manager.service';

import { BasicGroup } from '../_models/group/basic-group';

import * as _ from 'underscore';

@Injectable({
	providedIn: 'root'
})
export class GroupService {
	
	// Only stores basic information of groups
	// NOTE groups are only stored in same tab, if groups should be stored across tabs, use local storage, but then, garbage collection / cache expiration is necessary
	public groups: BasicGroup[] = [];

	constructor(
		private httpManagerService: HttpManagerService
	) { }
	
	/**
	 * @desc: Gets static information about group where user is member (internal group)
	 */
	// FIXME Loads two times from server (group.component and members.component)
	public getBasicGroupAsync(groupId: string): Observable<BasicGroup> {
		// Create Observable, such that subscribe can be used, after this function was called
		return Observable.create((observer: Observer<BasicGroup>) => {
			// Try to get group from cache
			const cachedGroup = _.findWhere(this.groups, { 'groupId': groupId });
			
			// If group was found in cache, return it
			if (cachedGroup) {
				console.log('from cache');
				// Hand over to next subscription
				observer.next(cachedGroup);
				observer.complete();
			// If group was not cached, get it from server, store it in cache an return it
			} else {
				return this.httpManagerService.get('/json/group/basic/' + groupId).subscribe((group) => {
					console.log('from server');
					// Add group to cache
					this.groups.push(new BasicGroup(group));
					// Hand over to next subscription
					observer.next(group);
					observer.complete();
				});
			}
		});
	}
	
	/**
	 * @desc: Gets the ratings of all group members, used for members tab in group
	 */
	public getMembersRatings(groupId: string): Observable<any> {
		return this.httpManagerService.get('/json/group/ratings/' + groupId);
	}
}
