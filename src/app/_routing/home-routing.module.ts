import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';

import { TopiclistComponent } from '../home/topiclist/topiclist.component';

const homeChildRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent }
];

const homeRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: homeChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(homeRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload'
   	})
	],
	exports: [ RouterModule ],
	declarations: []
})
export class HomeRoutingModule { }
