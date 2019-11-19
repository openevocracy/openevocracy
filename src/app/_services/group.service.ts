import { Injectable } from '@angular/core';

import { HttpManagerService } from './http-manager.service';

import { GroupInternal } from '../_models/group/groupinternal';

import * as _ from 'underscore';

@Injectable({
	providedIn: 'root'
})
export class GroupService {
	
	// Only stores static information of groups
	// NOTE groups are only stored in same tab, if groups should be stored across tabs, use local storage, but then, garbage collection is necessary
	public groupsInternal: GroupInternal[];
	//public groupsExternal: GroupExternal[];

	constructor(
		private httpManagerService: HttpManagerService
	) { }
	
	/**
	 * @desc: Gets static information about group where user is member (internal group)
	 */
	public getGroupInternal(groupId: string): GroupInternal {
		// Try to get group from cache
		const cachedGroup = _.findwhere(this.groupsInternal, { 'groupId': groupId });
		
		// If group was found in cache, return it
		if (cachedGroup) {
			return cachedGroup;
		// If group was not cached, get it from server, store it in cache an return it
		} else {
			this.httpManagerService.get('/json/group/static/internal/' + groupId).subscribe((group) => {
				this.groupsInternal.push(group);
				return group;
			});
		}
	}
}
