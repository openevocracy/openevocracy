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
	 * @desc: Gets basic group from cache
	 */
	public getBasicGroupFromCache(groupId: string): BasicGroup {
		return this.groups.find((group) => group.groupId == groupId);
	}
	
	/**
	 * @desc: Gets basic information about group from either server (fist load) or cache (second+ load)
	 */
	public getBasicGroupAsync(groupId: string): Observable<BasicGroup> {
		// Create Observable, such that subscribe can be used, after this function was called
		return Observable.create((observer: Observer<BasicGroup>) => {
			// Try to get group from cache
			const cachedGroupIndex = this.groups.findIndex(group => group.groupId == groupId);
			
			// If group was found in cache and was not expired inbetween, return it
			// Note: Groups in finished or rejected topics are always taken from the database (expiration equals last deadline)
			//       We assume that these groups are not opened very often
			//if (cachedGroup !== undefined && cachedGroup.expiration > Date.now()) {
			if (cachedGroupIndex != -1 && this.groups[cachedGroupIndex].expiration > Date.now()) {
				// Hand over to next subscription
				observer.next(this.groups[cachedGroupIndex]);
				observer.complete();
			// If group was not cached, get it from server, store it in cache an return it
			} else {
				return this.httpManagerService.get('/json/group/basic/' + groupId).subscribe((group) => {
					const groupFromDb = new BasicGroup(group);
					
					// If group was not cached before, add group to cache
					if (cachedGroupIndex == -1) {
						this.groups.push(groupFromDb);
					// If group was cached, update cache
					} else {
						this.groups[cachedGroupIndex] = groupFromDb;
					}
					
					// Hand over to next subscription
					observer.next(groupFromDb);
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
