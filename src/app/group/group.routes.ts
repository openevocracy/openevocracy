import { Routes } from '@angular/router';

import { GroupEditorComponent } from './editor/editor.component';
import { GroupDocumentComponent } from './document/document.component';
import { GroupChatComponent } from './chat/chat.component';
import { GroupMembersComponent } from './members/members.component';
import { GroupForumThreadComponent } from './forum/thread/thread.component';
import { GroupForumComponent } from './forum/forum.component';

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
