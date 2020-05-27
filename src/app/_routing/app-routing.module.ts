import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

// Components
import { SecureComponent } from '../secure/secure.component';
import { TopiclistComponent } from '../topiclist/topiclist.component';
import { EditorComponent } from '../editor/editor.component';
//import { PadviewComponent } from '../padview/padview.component';

// Topic module
//import { TopicComponent } from '../topic/topic.component';
//import { TopicOverviewComponent } from '../topic/overview/overview.component';
//import { TopicProposalComponent } from '../topic/proposal/proposal.component';
//import { TopicGroupsComponent } from '../topic/groups/groups.component';

// Group module
//import { GroupComponent } from '../group/group.component';
//import { GroupEditorComponent } from '../group/editor/editor.component';
//import { GroupDocumentComponent } from '../group/document/document.component';
//import { GroupChatComponent } from '../group/chat/chat.component';
//import { GroupMembersComponent } from '../group/members/members.component';
//import { GroupForumThreadComponent } from '../group/forum/thread/thread.component';
//import { GroupForumComponent } from '../group/forum/forum.component';

// User module
//import { UserComponent } from '../user/user.component';
//import { UserprofileOverviewComponent } from '../user/overview/overview.component';
//import { UserprofileActivityComponent } from '../user/activities/activities.component';
//import { SettingsComponent } from '../user/settings/settings.component';

const appChildRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent },
	//{
	//	path: 'topic/:id',
	//	component: TopicComponent,
	//	resolve: { 'manageTopic': TopicResolver },
	//	runGuardsAndResolvers: 'always',
	//	children: [
	//		{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	//		{ path: 'overview', component: TopicOverviewComponent },
	//		{ path: 'proposal', component: TopicProposalComponent },
	//		{ path: 'groups', component: TopicGroupsComponent }
	//	]
	//},
	//{ path: 'topic/editor/:id', component: EditorComponent },  // TODO implement into topic
	//{ path: 'proposal/view/:id', component: PadviewComponent },  // TODO implement into topic
	//{ path: 'proposal/editor/:id', component: EditorComponent },  // TODO implement into topic
	//{
	//	path: 'group/:id',
	//	component: GroupComponent,
	//	resolve: { 'basicGroup': GroupResolver },
	//	runGuardsAndResolvers: 'always',
	//	children: [
	//		{ path: '', redirectTo: 'editor', pathMatch: 'full' },
	//		{ path: 'editor', component: GroupEditorComponent },
	//		{ path: 'document', component: GroupDocumentComponent },
	//		{ path: 'chat', component: GroupChatComponent },
	//		{ path: 'forum', component: GroupForumComponent },
	//		{ path: 'forum/thread/:id', component: GroupForumThreadComponent },
	//		{ path: 'members', component: GroupMembersComponent }
	//	]
	//},
	//{
	//	path: 'user/profile/:id',
	//	component: UserComponent,
	//	runGuardsAndResolvers: 'always',
	//	children: [
	//		{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	//		{ path: 'overview', component: UserprofileOverviewComponent },
	//		{ path: 'activity', component: UserprofileActivityComponent }
	//	]
	//},
	//{ path: 'settings/:id', component: SettingsComponent }
];

const appRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: appChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(appRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload'
		})
	],
	exports: [ RouterModule ],
	providers: [],
	declarations: []
})
export class AppRoutingModule { }
