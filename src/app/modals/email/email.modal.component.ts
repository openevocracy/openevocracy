import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { EmailModalService } from '../../_services/modal.email.service';

@Component({
	selector: 'modal-email',
	templateUrl: './email.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalEmailComponent extends ModalComponent {
	
	public emailForm: FormGroup;
	public title: string;
	
	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private emailModalService: EmailModalService,
		private fb: FormBuilder) {
		
		super(modalService, el);
		
		this.emailForm = this.fb.group({
			email: ['', Validators.email]
		});
	}
	
	onSubmit() {
		// Pass email to password forget service
		this.emailModalService.setEmail(this.emailForm.value.email);
		
		// Close Modal
		super.close();
	}
	
	open(data) {
		this.emailForm.setValue({ 'email': data.email });
		this.title = data.title;
		super.open(data);
	}
	
	close() {
		super.close();
	}
	
}
