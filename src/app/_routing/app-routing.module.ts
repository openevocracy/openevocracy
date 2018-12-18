import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';
import { TopiclistComponent } from '../topiclist/topiclist.component';
import { TopicComponent } from '../topic/topic.component';
import { EditorComponent } from '../editor/editor.component';
import { GroupComponent } from '../group/group.component';
import { PadviewComponent } from '../padview/padview.component';
import { SettingsComponent } from '../settings/settings.component';
import { UserprofileComponent } from '../userprofile/userprofile.component';
import { GroupForumComponent } from '../groupforum/groupforum.component';

const appChildRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent },
	{ path: 'topic/:id', component: TopicComponent },
	{ path: 'topic/editor/:id', component: EditorComponent },
	{ path: 'proposal/editor/:id', component: EditorComponent },
	{ path: 'group/editor/:id', component: GroupComponent },
	{ path: 'proposal/view/:id', component: PadviewComponent },
	{ path: 'group/view/:id', component: PadviewComponent },
	{ path: 'group/forum/:id', component: GroupForumComponent },
	{ path: 'settings/:id', component: SettingsComponent },
	{ path: 'user/profile/:id', component: UserprofileComponent }
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
