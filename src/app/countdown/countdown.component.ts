import { Component, Input, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
	selector: 'countdown',
	template: '{{ displayTime }}',
	styleUrls: ['./countdown.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownComponent implements OnDestroy {
	private timestamp: number;
	private interval;
	private format: string = '{dd} days {hh}:{mm}:{ss}';
	
	@Input()
	public set time(value: string | number) {
		this.timestamp = parseInt(value as string);
		this._startTimer();
	}

	constructor(private changeDetectorRef: ChangeDetectorRef) { }
	
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
		let days, hours, minutes, seconds, delta = this.delta, time = this.format;
		
		// Calculate time in days/hrs/min/sec from delta
		days = Math.floor(delta / 86400);
		delta -= days * 86400;
		hours = Math.floor(delta  / 3600) % 24;
		delta -= hours * 3600;
		minutes = Math.floor(delta  / 60) % 60;
		delta -= minutes * 60;
		seconds = delta % 60;
		
		// Create time remaining string
		time = time.replace('{dd}', days);
		time = time.replace('{hh}', hours);
		time = time.replace('{mm}', minutes);
		time = time.replace('{ss}', seconds);
		
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
			if(this.delta <= 0)
				this._stopTimer();
		}, 1000);
	}

	private _stopTimer() {
		clearInterval(this.interval);
		this.interval = undefined;
	}
}
