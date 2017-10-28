import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AddtopicService {
	
	private subject = new Subject<any>();

	constructor() { }
	
	setTopicname(topicname: string) {
	  this.subject.next(topicname);
	}
	
	getTopicname(): Observable<any> {
	  return this.subject.asObservable();
	}

}
