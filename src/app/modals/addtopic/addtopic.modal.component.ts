import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { TopicService } from '../../_services/topic.service';

import { TranslateService } from '@ngx-translate/core';

import { minLengthTopicName } from '../../_shared/config';

@Component({
	selector: 'modal-addtopic',
	templateUrl: './addtopic.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalAddtopicComponent extends ModalComponent {
	
	private addTopicForm: FormGroup;
	private topicnamePlaceholder: String;
	
	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private router: Router,
		private topicService: TopicService,
		private translate: TranslateService,
		private fb: FormBuilder) {
		
		super(modalService, el);
		
		this.addTopicForm = this.fb.group({
			topicname: ['', Validators.minLength(minLengthTopicName)]
		});
	
	}
	
	onSubmit() {
		// Pass topic name to topicService
		this.topicService.addTopic(this.addTopicForm.value.topicname).subscribe(topic => {
			// Navigate to new topic
			this.router.navigate(['/topic/'+topic._id]);
		});
		
		// Close Modal
		this.close();
	}
	
	open(data) {
		this.translate.get("MODAL_NEW_TOPIC_NAME", {numChars: String(minLengthTopicName)}).subscribe(
			str => {this.topicnamePlaceholder = str; });
			
		//this.translate.get("MODAL_NEW_TOPIC_NAME").subscribe(
		//	str => {this.topicnamePlaceholder = str + String(minLengthTopicName); });
	    //this.translate.get("MODAL_NEW_TOPIC_NAME_SUFFIX").subscribe(
		//	str => {this.topicnamePlaceholder += str; });
			
		super.open(data);
	}
	
	close() {
		super.close();
		this.addTopicForm.setValue({'topicname': ''});
	}
	
}
