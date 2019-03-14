import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { HttpManagerService } from '../_services/http-manager.service';

import { faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';

import { Thread } from "../_models/thread";

@Component({
	selector: 'app-groupforumthread',
	templateUrl: './groupforumthread.component.html',
	styleUrls: ['./groupforumthread.component.scss']
})
export class GroupForumThreadComponent implements OnInit {
	
	public thread: Thread;
	
	// FontAwesome icons
	public faArrowAltCircleLeft = faArrowAltCircleLeft;

	constructor(
		private activatedRoute: ActivatedRoute,
		private httpManagerService: HttpManagerService) {
	}
	
	ngOnInit() {
		// Get forum id from url
		this.activatedRoute.params.subscribe((params: Params) => {
			const threadId = params.id;
			
			// Get current forum information
			this.httpManagerService.get('/json/group/forum/thread/' + threadId).subscribe(res => {
				this.thread = new Thread(res);
				console.log(this.thread);
			});
		});
	}

}
