import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { GroupResolver } from '../_resolver/group.resolver';

import { SecureComponent } from '../secure/secure.component';
import { TopiclistComponent } from '../topiclist/topiclist.component';
import { TopicComponent } from '../topic/topic.component';
import { EditorComponent } from '../editor/editor.component';
import { GroupComponent } from '../group/group.component';
import { GroupEditorComponent } from '../group/editor/editor.component';
import { GroupDocumentComponent } from '../group/document/document.component';
import { GroupChatComponent } from '../group/chat/chat.component';
import { GroupMembersComponent } from '../group/members/members.component';
import { GroupForumThreadComponent } from '../group/forum/thread/thread.component';
import { GroupForumComponent } from '../group/forum/forum.component';
import { PadviewComponent } from '../padview/padview.component';
import { SettingsComponent } from '../settings/settings.component';
import { UserprofileComponent } from '../userprofile/userprofile.component';

const appChildRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent },
	{ path: 'topic/:id', component: TopicComponent },
	{ path: 'topic/editor/:id', component: EditorComponent },
	{ path: 'proposal/view/:id', component: PadviewComponent },
	{ path: 'proposal/editor/:id', component: EditorComponent },
	{
		path: 'group/:id',
		component: GroupComponent,
		resolve: { 'basicGroup': GroupResolver },
		children: [
			{ path: '', redirectTo: 'editor', pathMatch: 'full' },
			{ path: 'editor', component: GroupEditorComponent },
			{ path: 'document', component: GroupDocumentComponent },
			{ path: 'chat', component: GroupChatComponent },
			{ path: 'forum', component: GroupForumComponent },
			{ path: 'forum/thread/:id', component: GroupForumThreadComponent },
			{ path: 'members', component: GroupMembersComponent }
		]
	},
	{ path: 'settings/:id', component: SettingsComponent },
	{ path: 'user/profile/:id', component: UserprofileComponent }
];

const appRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: appChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(appRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled'
		})
	],
	exports: [ RouterModule ],
	providers: [ GroupResolver ],
	declarations: []
})
export class AppRoutingModule { }
