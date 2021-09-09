import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { forkJoin } from 'rxjs/observable/forkJoin';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root'
})
export class StageUpdateService {
	
	constructor(
		private snackBar: MatSnackBar,
		private translateService: TranslateService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) { }
  
	/*
	 * @desc: Initialize timer and redirect from editor to view if deadline is over
	 */
	public initCountdown(deadline, route): number {
		let delta = deadline - Date.now();
		
		// Safely exit here, when deadline is over
		if (delta <= 0)
			return 0;
		
		// Run callback every second
		const interval = setInterval(() => {
			delta = deadline - Date.now();
			const seconds = Math.floor(delta/1000);
			
			// If less than 2 minutes (120000ms) left, show time remaining in snackbar every 10 seconds
			if (delta > 0 && delta <= 120000 && seconds % 10 == 0) {
				var secondsLeft = String(Math.round(delta/1000));
				forkJoin(
					this.translateService.get('EDITOR_SNACKBAR_CLOSE_SECONDS', {s: secondsLeft}),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					this.snackBar.open(msg, action, {
						'duration': 3000
					});
				});
			}
			
			// If less than 2 hours (7200000ms) left, show time remaining in snackbar every 10 minutes
			if (delta > 0 && delta <= 7200000 && delta > 120000 && seconds % 600 == 0) {
				var minutesLeft = String(Math.round(delta/(1000*60)));
				forkJoin(
					this.translateService.get('EDITOR_SNACKBAR_CLOSE_MINUTES', {m: minutesLeft}),
					this.translateService.get('FORM_BUTTON_CLOSE'))
				.subscribe(([msg, action]) => {
					this.snackBar.open(msg, action, {
						'duration': 10000
					});
				});
			}
			
			// If countdown has finished, stop interval and update view
			if (delta <= 0) {
				clearInterval(interval);
				// Reload route
				this.router.routeReuseStrategy.shouldReuseRoute = () => false;
				this.router.onSameUrlNavigation = 'reload';
				this.router.navigate(route);
			}
		}, 1000);
		
		// Return the interval, sucht that the parent is able to close it
		return interval;
	}
}
