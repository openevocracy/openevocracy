import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';
import { TopiclistComponent } from '../topiclist/topiclist.component';
import { TopicComponent } from '../topic/topic.component';
import { EditorComponent } from '../editor/editor.component';
import { SettingsComponent } from '../settings/settings.component';

const appChildRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent },
	{ path: 'topic/:id', component: TopicComponent },
	{ path: 'topic/editor/:id', component: EditorComponent },
	{ path: 'proposal/editor/:id', component: EditorComponent },
	{ path: 'group/editor/:id', component: EditorComponent },
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
