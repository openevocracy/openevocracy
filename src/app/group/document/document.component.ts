import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { GroupService } from '../../_services/group.service';

@Component({
	selector: 'app-document',
	templateUrl: './document.component.html',
	styleUrls: ['./document.component.scss']
})
export class GroupDocumentComponent implements OnInit {
  
	public padHtml: string;
	
	constructor(
		private router: Router,
		private groupService: GroupService
	) {
		// Get groupId
		const groupId = this.router.url.split('/')[2];
		
		// Get group from group service cache
		const group = this.groupService.getBasicGroupFromCache(groupId);
		
		// Define group pad html
		this.padHtml = group.padHtml;
	}
	
	ngOnInit() {
	}

}
