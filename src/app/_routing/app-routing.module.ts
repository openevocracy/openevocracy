import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';
import { TopiclistComponent } from '../topiclist/topiclist.component';
import { TopicComponent } from '../topic/topic.component';
import { SettingsComponent } from '../settings/settings.component';

const appChildRoutes: Routes = [
	{ path: '', redirectTo: 'topics', pathMatch: 'full' },
	{ path: 'topics', component: TopiclistComponent },
	{ path: 'topic/:id', component: TopicComponent },
	{ path: 'settings/:id', component: SettingsComponent }
];

const appRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: appChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(appRoutes)
	],
	exports: [ RouterModule ],
	declarations: []
})
export class AppRoutingModule { }
