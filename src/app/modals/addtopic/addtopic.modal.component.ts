import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { TopicService } from '../../_services/topic.service';
import { ConfigService } from '../../_services/config.service';

import { Activity } from '../../_models/activity';
import { ActivityListService} from '../../_services/activitylist.service';
import { C } from '../../../../shared/constants';

import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'modal-addtopic',
	templateUrl: './addtopic.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalAddtopicComponent extends ModalComponent {
	private cfg: any;
	public addTopicForm: FormGroup;
	public topicnamePlaceholder: String;
	public C;
	
	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private router: Router,
		private topicService: TopicService,
		private translate: TranslateService,
		private activityListService: ActivityListService,
		private fb: FormBuilder,
		private configService: ConfigService) {
			super(modalService, el);
			
			this.cfg = configService.get();
			
			this.C = C;
			
			this.addTopicForm = this.fb.group({
				topicname: ['', Validators.minLength(this.cfg.minLengthTopicName)]
			});
		}
	
	onSubmit() {
		let topicId : string; 
		
		// Pass topic name to topicService
		this.topicService.addTopic(this.addTopicForm.value.topicname).subscribe(topic => {
			// Save topic id
			topicId = topic._id;
			
			// Navigate to new topic
			this.router.navigate(['/topic/'+topicId]);
			
			// Add activity
			this.activityListService.addActivity(C.ACT_TOPIC_CREATE, topicId).subscribe(res => {
					if (!res)
					{
						console.log("Error: ACT_TOPIC_CREATE could not be added.");
					}
			});
		});
		
		
		
		// Close Modal
		this.close();
	}
	
	open(data) {
		this.translate.get("MODAL_NEW_TOPIC_NAME", {numChars: String(this.cfg.MIN_LETTERS_TOPIC_NAME)}).subscribe(
			str => {this.topicnamePlaceholder = str; });
			
		//this.translate.get("MODAL_NEW_TOPIC_NAME").subscribe(
		//	str => {this.topicnamePlaceholder = str + String(cfg.MIN_LETTERS_TOPIC_NAME); });
	    //this.translate.get("MODAL_NEW_TOPIC_NAME_SUFFIX").subscribe(
		//	str => {this.topicnamePlaceholder += str; });
			
		super.open(data);
	}
	
	close() {
		super.close();
		this.addTopicForm.setValue({'topicname': ''});
	}
	
}
