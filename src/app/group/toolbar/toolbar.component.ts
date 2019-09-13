import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, Event, NavigationEnd } from '@angular/router';

import { HttpManagerService } from '../../_services/http-manager.service';

import { faTimes, faExpandArrowsAlt, faComments, faUsers, faFile } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'group-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss']
})
export class GroupToolbarComponent implements OnInit {
	
	public activeTab: string = 'editor';
	public groupId: string;
	public title: string;
  
	public faExpandArrowsAlt = faExpandArrowsAlt;
	public faComments = faComments;
	public faTimes = faTimes;
	public faUsers = faUsers;
	public faFile = faFile;
	
	constructor(
		private router: Router,
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService
	) {
		// Listen to route changes
		this.router.events.subscribe((event: Event) => {
			// If navigation has finished
			if (event instanceof NavigationEnd) {
				// Get current path and define active tab
				this.activeTab = this.router.url.split('/')[3];
         }
		});
	}
	
	ngOnInit() {
		this.activatedRoute.params.subscribe((params: Params) => {
			// Get group id from url
			this.groupId = params.id;
			
			// Get data for toolbar from server
			this.httpManagerService.get('/json/group/toolbar/' + this.groupId).subscribe(res => {
				// Define title
				this.title = res.groupName + ' / ' + res.topicTitle;
			});
		});
	}

}
