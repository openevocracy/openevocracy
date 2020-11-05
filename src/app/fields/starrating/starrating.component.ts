import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { faStar } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'starrating',
	templateUrl: './starrating.component.html',
	styleUrls: ['./starrating.component.scss']
})
export class StarratingComponent implements OnInit {
	
	@Input() public rateValue: number;
	@Input() public ratingId: number;
	@Output() public onRate: EventEmitter<any> = new EventEmitter<any>();
	
	public hoverValue: number;
	public starsArray: number[] = [1,2,3,4,5];
	public inputName: string;
	
	public faStar = faStar;

	constructor() { }
  
	ngOnInit() {
		// Define name for input fields
		this.inputName = 'rating_' + this.ratingId;
	}
	
	/**
	 * @desc: If a star was clicked
	 */
	private onClick(selection: number): void {
		// Set new rating
		this.rateValue = selection;
		
		// Trigger event that a rating was selected
		this.onRate.emit({
			'ratingId': this.ratingId,
			'ratingValue': selection
		});
	}
	
	/**
	 * @desc: On hovering a star, set hover css class for styling
	 */
	private onHover(hoverValue: number): void {
		// Set hover value for styling
		this.hoverValue = hoverValue;
	}
	
	/**
	 * @desc: On leaving after hovering a star, remove hover css class
	 */
	private onLeave(): void {
		this.hoverValue = 0;
	}

}
