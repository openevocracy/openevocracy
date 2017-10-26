import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { PwforgetService } from '../../_services/pwforget.service';

@Component({
	selector: 'modal-pwforget',
	templateUrl: './pwforget.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalPwforgetComponent extends ModalComponent {
	
	private pwforgetForm: FormGroup;
	
	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private pwforgetService: PwforgetService,
		private fb: FormBuilder) {
		
		super(modalService, el);
		
		this.pwforgetForm = this.fb.group({
			email: ['', Validators.email]
		});
	}
	
	onSubmit() {
		// Pass email to password forget service
		this.pwforgetService.setEmail(this.pwforgetForm.value.email);
		
		// Close Modal
		super.close();
	}
	
	open(data) {
		this.pwforgetForm.setValue({ 'email': data.email });
		super.open(data);
	}
	
}
