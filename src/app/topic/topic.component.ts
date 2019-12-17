import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
	selector: 'app-topic',
	templateUrl: './topic.component.html',
	styleUrls: ['./topic.component.scss']
})
export class TopicComponent implements OnInit, OnDestroy {
	
	public routerSubscription: any;
	
	constructor(
		private router: Router
	) {
		this.router.routeReuseStrategy.shouldReuseRoute = function () {
			return false;
		};
		
		this.routerSubscription = this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				// Trick the Router into believing it's last link wasn't previously loaded
				this.router.navigated = false;
			}
		});
	}
	
   ngOnInit() {}
   
   ngOnDestroy() {
   	// Unsubscribe from subscription to avoid memory leak
		if (this.routerSubscription)
			this.routerSubscription.unsubscribe();
	}

}
