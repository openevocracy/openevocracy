import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { TopicListElement } from '../_models/topic-list-element'; // FIXME currently qual to topic list element, but needs to be extended
import { baseURL } from '../_shared/config';

import { HttpManagerService } from './http-manager.service';

//import 'rxjs/add/operator/catch';

@Injectable()
export class TopicService {

	constructor(
		private http: Http,
		private httpManagerService: HttpManagerService) { }
				
	getTopic(tid): Observable<TopicListElement> {
		return this.http.get(baseURL + 'json/topic/' + tid, {withCredentials: true})
		   .map(res => { return this.httpManagerService.extractData(res); })
		   .catch(error => { return this.httpManagerService.handleError(error); });
	}

}
