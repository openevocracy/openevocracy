// http://jasonwatmore.com/post/2017/01/24/angular-2-custom-modal-window-dialog-box
import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import * as $ from 'jquery';

import { ModalService } from '../_services/modal.service';

@Component({
	selector: 'modal',
	templateUrl: './modal.component.html',
	styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
	@Input() id: string;
	private element: JQuery;

	constructor(
		protected modalService: ModalService,
		protected el: ElementRef) {
			
		this.element = $(el.nativeElement);
	}
	
	ngOnInit() {
		let modal = this;
	
		// Move element to bottom of page (just before </body>) so it can be displayed above everything else
		this.element.appendTo('body');
	
		// Close modal on background click
		this.element.on('click', function (e: any) {
			var target = $(e.target);
			if (!target.closest('.modal-dialog').length) {
				modal.close();
			}
		});
	
		// Add self (this modal instance) to the modal service so it's accessible from controllers
		this.modalService.add(this);
	}
	
	ngOnDestroy() {
		this.modalService.remove();
		this.element.remove();
	}
	
	protected open(data) {
		this.element.fadeIn();
		$('body').addClass('modal-open');
	}
	
	protected close() {
		this.element.fadeOut();
		$('body').removeClass('modal-open');
	}

}
