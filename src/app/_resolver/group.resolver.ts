import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { GroupService } from '../_services/group.service';

import { BasicGroup } from '../_models/group/basic-group';

@Injectable()
export class GroupResolver implements Resolve<BasicGroup> {
	constructor(private groupService: GroupService) {}
	
	public resolve(route: ActivatedRouteSnapshot) {
		// Get basic group from group service
		return this.groupService.getBasicGroupAsync(route.params.id);
	}
}
