import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PwforgetService {
	
	private subject = new Subject<any>();

	constructor() { }
	
	setEmail(email: string) {
		this.subject.next(email);
	}
	
	getEmail(): Observable<any> {
		return this.subject.asObservable();
	}

}
