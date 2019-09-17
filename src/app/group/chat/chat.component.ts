import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['../group.component.scss', './chat.component.scss']
})
export class GroupChatComponent implements OnInit {
	public thread: any;
	
	constructor() { }
	
	ngOnInit() {
	}

}
