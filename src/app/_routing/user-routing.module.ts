import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';

import { UserComponent } from '../user/user.component';
import { UserprofileOverviewComponent } from '../user/overview/overview.component';
import { UserprofileActivityComponent } from '../user/activities/activities.component';
import { SettingsComponent } from '../user/settings/settings.component';

const userChildRoutes: Routes = [
	{ path: 'user/profile/:id',
		component: UserComponent,
		runGuardsAndResolvers: 'always',
		children: [
			{ path: '', redirectTo: 'overview', pathMatch: 'full' },
			{ path: 'overview', component: UserprofileOverviewComponent },
			{ path: 'activity', component: UserprofileActivityComponent }
		] },
	{ path: 'settings/:id', component: SettingsComponent }
];

const userRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: userChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(userRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload'
		})
	],
	exports: [ RouterModule ],
	providers: [],
	declarations: []
})
export class UserRoutingModule { }
