import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

import { ModalService } from './modal.service'

@Injectable()
export class CloseeditorModalService {
	
	private subject = new Subject<any>();

	constructor() { }
	
	public setResponse(leave: boolean) {
		this.subject.next(leave);
	}
	
	public getResponse(): Observable<any> {
		return this.subject.asObservable();
	}

}
