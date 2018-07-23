import { Component, Input, Output, OnDestroy, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

/*function timeStr(t : number) {
	if (t < 10)
		return "0" + String(t); // add leading zero
	else	
		return String(t);

}*/
	
@Component({
	selector: 'countdown',
	template: '{{ displayTime }}',
	styleUrls: ['./countdown.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownComponent implements OnDestroy {
	private timestamp: number;
	private interval;
	//private format: string = '{dd} days {hh}:{mm}:{ss}';
	
	@Input()
	public set time(value: string | number) {
		this.timestamp = parseInt(value as string);
		this._startTimer();
	}
	
	@Output()
	private passed = new EventEmitter<string>();

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private translate: TranslateService) { }
	
	ngOnDestroy() {
		this.changeDetectorRef.detach();
	}
	
	public get delta() {
		// Get current datetime as timestamp
		let date = new Date();
		
		// Return difference between current datetime and given timestamp 
		return Math.max(0, Math.floor((this.timestamp - date.getTime()) / 1000));
	}
	
	public get displayTime() {
		let days, hours, minutes, seconds, delta = this.delta;
		let time = ""; //this.format;
		
		// Calculate time in days/hrs/min/sec from delta
		days = Math.floor(delta / 86400);
		delta -= days * 86400;
		hours = Math.floor(delta  / 3600) % 24;
		delta -= hours * 3600;
		minutes = Math.floor(delta  / 60) % 60;
		delta -= minutes * 60;
		seconds = delta % 60;
		
		if (this.delta < 60) // in this case, display seconds left
		{
			this.translate.get("STAGE_COUNTDOWN_SECONDS_LEFT", {ss: String(seconds)}).
				subscribe(str => {time = str; });
		}
		else if (this.delta < 3600) // in this case, display minutes left
		{
			this.translate.get("STAGE_COUNTDOWN_MINUTES_LEFT", {mm: String(minutes)}).
				subscribe(str => {time = str; });
		}
		else if (this.delta < 86400) // in this case, display hours left
		{
			this.translate.get("STAGE_COUNTDOWN_HOURS_LEFT", {hh: String(hours)}).
				subscribe(str => {time = str; });
		}
		else // in this case, display days left
		{
			this.translate.get("STAGE_COUNTDOWN_DAYS_LEFT", {dd: String(days)}).
				subscribe(str => {time = str; });
		}
		
		// Return remaining time as string (given by format)
		return time;
	}

	private _startTimer() {
		// If time is already over, do nothing
		if(this.delta <= 0) return;
		
		// Stop timer (for the case it is still running ?)
		this._stopTimer();
		
		// Update countdown every 1 second
		this.interval = setInterval(() => {
			// Update countdown
			this.changeDetectorRef.markForCheck();
			
			// If timer is over, stop countdown
			if(this.delta <= 0) {
				this._stopTimer();
				// Inform parent that countdown has finished
				this.passed.emit(null);
			}
		}, 1000);
	}

	private _stopTimer() {
		clearInterval(this.interval);
		this.interval = undefined;
	}
}
