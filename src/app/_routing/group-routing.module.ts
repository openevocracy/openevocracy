import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { GroupResolver } from '../_resolver/group.resolver';

//import { SecureComponent } from '../secure/secure.component';

/*import { GroupComponent } from '../group/group.component';
import { GroupEditorComponent } from '../group/editor/editor.component';
import { GroupDocumentComponent } from '../group/document/document.component';
import { GroupChatComponent } from '../group/chat/chat.component';
import { GroupMembersComponent } from '../group/members/members.component';
import { GroupForumThreadComponent } from '../group/forum/thread/thread.component';
import { GroupForumComponent } from '../group/forum/forum.component';*/

/*const groupChildRoutes: Routes = [
	{ path: 'group/:id',
		component: GroupComponent,
		resolve: { 'basicGroup': GroupResolver },
		runGuardsAndResolvers: 'always',
		children: [
			{ path: '', redirectTo: 'editor', pathMatch: 'full' },
			{ path: 'editor', component: GroupEditorComponent },
			{ path: 'document', component: GroupDocumentComponent },
			{ path: 'chat', component: GroupChatComponent },
			{ path: 'forum', component: GroupForumComponent },
			{ path: 'forum/thread/:id', component: GroupForumThreadComponent },
			{ path: 'members', component: GroupMembersComponent }
		] }
];*/

/*const groupRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: groupChildRoutes }
];*/

@NgModule({
	imports: [
		CommonModule,
		/*RouterModule.forRoot(groupRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload'
		})*/
		//RouterModule.forChild(groupChildRoutes)
		RouterModule.forRoot([])
	],
	exports: [ RouterModule ],
	providers: [ GroupResolver ],
	declarations: []
})
export class GroupRoutingModule { }
