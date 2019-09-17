import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { forkJoin } from 'rxjs/observable/forkJoin';

import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class SnackbarService {

  constructor(
  		private snackBar: MatSnackBar,
		private translateService: TranslateService) { }
		
	
	/**
	 * @desc: Show snackbar notification
	 */
	public showSnackbar(title, afterDismissed?, durationTime?) {
		forkJoin(
			this.translateService.get(title),
			this.translateService.get('FORM_BUTTON_CLOSE'))
		.subscribe(([msg, action]) => {
			// Open snackbar for 5 seconds or for specified time
			const duration = ((durationTime) ? durationTime : 5000);
			const snackBarRef = this.snackBar.open(msg, action, {
				'duration': duration
			});
			// If afterDismissed callback was given as argument, call function after dismiss
			if (afterDismissed) {
				snackBarRef.afterDismissed().subscribe(() => {
					afterDismissed();
				});
			}
		});
	}
}
