import { Injectable } from '@angular/core';

@Injectable()
export class ModalService {
	private modal: any;
	
	public add(modal: any) {
		console.log(modal);
		this.modal = modal;
	}
	
	public remove() {
		this.modal = null;
	}
	
	public open(data) {
		if(this.modal)
			this.modal.open(data);
		else
			console.error("Cannot open non existing modal.");
	}
	
	public close() {
		if(this.modal)
			this.modal.close();
		else
			console.error("Cannot close non existing modal.");
	}
}
