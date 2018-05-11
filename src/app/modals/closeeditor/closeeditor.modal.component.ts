import { Component, ElementRef } from '@angular/core';

import { ModalComponent } from '../modal.component';

import { ModalService } from '../../_services/modal.service';
import { CloseeditorModalService } from '../../_services/modal.closeeditor.service';

@Component({
	selector: 'modal-closeeditor',
	templateUrl: './closeeditor.modal.component.html',
	styleUrls: ['../modal.component.scss']
})
export class ModalCloseeditorComponent extends ModalComponent {
	
	private title: string;

	constructor(
		protected modalService: ModalService,
		protected el: ElementRef,
		private closeeditorModalService: CloseeditorModalService) {
		
		super(modalService, el);
	}
	
	private setResponse(leave: boolean) {
		this.closeeditorModalService.setResponse(leave);
	}

	public open() {
		super.open({});
	}

}
