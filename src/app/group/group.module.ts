import { NgModule } from '@angular/core';

import { GroupComponent } from './group.component';
import { GroupMemberbarComponent } from './memberbar/memberbar.component';
import { GroupEditorComponent } from './editor/editor.component';
import { GroupForumComponent } from './forum/forum.component';
import { GroupForumThreadComponent } from './forum/thread/thread.component';
import { GroupChatComponent } from './chat/chat.component';
import { GroupMembersComponent } from './members/members.component';
import { GroupToolbarComponent } from './toolbar/toolbar.component';
import { GroupDocumentComponent } from './document/document.component';

@NgModule({
	declarations: [
		GroupComponent,
		GroupMemberbarComponent,
		GroupEditorComponent,
		GroupForumComponent,
		GroupForumThreadComponent,
		GroupChatComponent,
		GroupMembersComponent,
		GroupToolbarComponent,
		GroupDocumentComponent
	]
})
export class GroupModule {}
