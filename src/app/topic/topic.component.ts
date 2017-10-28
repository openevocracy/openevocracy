import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { TopicService } from '../_services/topic.service';

import { TopicListElement } from '../_models/topic-list-element'; // FIXME currently qual to topic list element, but needs to be extended

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.css']
})
export class TopicComponent implements OnInit {
	private tid: string;
	topic: TopicListElement;

	constructor(
		private topicService: TopicService,
		private activatedRoute: ActivatedRoute) { }
	
	ngOnInit() {
		this.activatedRoute.params.subscribe(
			(params: Params) => this.tid = params['id']);
      
      this.topicService.getTopic(this.tid).subscribe(
			res => { this.topic = res; console.log(this.topic); });
	}

}
