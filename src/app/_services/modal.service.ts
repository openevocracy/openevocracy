import { Injectable } from '@angular/core';

@Injectable()
export class ModalService {
	private modal: any;
	
	add(modal: any) {
		this.modal = modal;
	}
	
	remove() {
		this.modal = null;
	}
	
	open(data) {
		if(this.modal)
			this.modal.open(data);
		else
			console.error("Cannot open non existing modal.");
	}
	
	close() {
		if(this.modal)
			this.modal.close();
		else
			console.error("Cannot close non existing modal.");
	}
}