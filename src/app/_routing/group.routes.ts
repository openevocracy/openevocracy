import { Routes } from '@angular/router';

import { GroupEditorComponent } from '../group/editor/editor.component';
import { GroupDocumentComponent } from '../group/document/document.component';
import { GroupChatComponent } from '../group/chat/chat.component';
import { GroupMembersComponent } from '../group/members/members.component';
import { GroupForumThreadComponent } from '../group/forum/thread/thread.component';
import { GroupForumComponent } from '../group/forum/forum.component';

const groupRoutes: Routes = [
	{ path: '', redirectTo: 'editor', pathMatch: 'full' },
	{ path: 'editor', component: GroupEditorComponent },
	{ path: 'document', component: GroupDocumentComponent },
	{ path: 'chat', component: GroupChatComponent },
	{ path: 'forum', component: GroupForumComponent },
	{ path: 'forum/thread/:id', component: GroupForumThreadComponent },
	{ path: 'members', component: GroupMembersComponent }
];

export { groupRoutes };
