import { Component } from '@angular/core';
import { LanguageService } from './_services/language.service';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';

@Component({
	selector: 'body',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	host: {'[class.loading]':'loading'}
})

export class AppComponent {
	private loading: boolean = false;
	private routing: boolean = false;
	
	constructor(
		private languageService: LanguageService,
		private router: Router
	) {
		// Initialize the language
		languageService.initializeTranslation();
		
		// Listen to route changes for visual effects
		router.events.subscribe((routerEvent: Event) => {
			this.checkRouterEvent(routerEvent)
		});
	}
	
	/**
	 * @desc: Shows a loading animation when loading takes a bit longer than normal
	 */
	public checkRouterEvent(routerEvent: Event): void {
		// Show loading if navigation starts
		if (routerEvent instanceof NavigationStart) {
			// Set routing active
			this.routing = true;
			// If routing is still ongoing after 100ms, show loading
			setTimeout(() => {
				if (this.routing)
					this.loading = true;
			}, 100);
		}
		
		// Hide loading if navigation ends
		if (
			routerEvent instanceof NavigationEnd ||
			routerEvent instanceof NavigationError ||
			routerEvent instanceof NavigationCancel
		) {
			// Set routing and loading false
			this.routing = false;
			this.loading = false;
		}
	}
}
