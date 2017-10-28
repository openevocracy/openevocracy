import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { AddtopicService } from '../../_services/addtopic.service';

import { TranslateService } from '@ngx-translate/core';

import { C } from '../../_shared/constants';

@Component({
	selector: 'modal-addtopic',
	templateUrl: './addtopic.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalAddtopicComponent extends ModalComponent {
	
	private addtopicForm: FormGroup;
	private topicnamePlaceholder: String;
	
	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private addtopicService: AddtopicService,
		private translate: TranslateService,
		private fb: FormBuilder) {
		
		super(modalService, el);
		
		this.addtopicForm = this.fb.group({
			topicname: ['', Validators.minLength(C.MIN_LENGTH_TOPIC_NAME)]
		});
	
	}
	
	onSubmit() {
		// Pass topic name to addtopicService
		//this.addtopicService.setTopicname(this.addtopicForm.value.topicname);
		
		// Close Modal
		this.close();
	}
	
	open(data) {
		this.translate.get("MODAL_NEW_TOPIC_NAME").subscribe(
			str => {this.topicnamePlaceholder = str + String(C.MIN_LENGTH_TOPIC_NAME); });
	    this.translate.get("MODAL_NEW_TOPIC_NAME_SUFFIX").subscribe(
			str => {this.topicnamePlaceholder += str; });
			
		super.open(data);
	}
	
	close() {
		super.close();
		this.addtopicForm.setValue({"topicname": ""});
	}
	
}
