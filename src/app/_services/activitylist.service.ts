import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Activity } from '../_models/activity';

import { HttpManagerService } from './http-manager.service';

import 'rxjs/add/operator/catch';

@Injectable()
export class ActivityListService {
	
	constructor(
		private httpManagerService: HttpManagerService) { }
		
	public getUserActivityList(profileId : string, skip : number, limit : number): Observable<Activity[]> {
		return this.httpManagerService.get('/json/useractivitylist/' + profileId);
	}
	
	public getUserActivityListLength(profileId : string): Observable<number> {
		return this.httpManagerService.get('/json/useractivitylistlen/' + profileId);
	}
	
	public addActivity(type: number, targetId: string): Observable<any> {
		return this.httpManagerService.post('/json/activity/create', { 'type': type, 'targetId': targetId });
	}
	
	public removeActivity(actId: string): Observable<boolean> {
		return this.httpManagerService.delete('/json/activity/' + actId);
	}
}
