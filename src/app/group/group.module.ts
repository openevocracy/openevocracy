import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { GroupResolver } from './group.resolver';

// Components
import { GroupComponent } from './group.component';
import { GroupMemberbarComponent } from './memberbar/memberbar.component';
import { GroupEditorComponent } from './editor/editor.component';
import { GroupForumComponent } from './forum/forum.component';
import { GroupForumThreadComponent } from './forum/thread/thread.component';
import { GroupChatComponent } from './chat/chat.component';
import { GroupMembersComponent } from './members/members.component';
import { GroupToolbarComponent } from './toolbar/toolbar.component';
import { GroupDocumentComponent } from './document/document.component';

// Modules
import { CountdownModule } from '../countdown/countdown.module';
import { FieldsModule } from '../fields/fields.module';
import { MaterialsModule } from '../materials/materials.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuillModule } from 'ngx-quill';
import { MentionModule } from 'angular-mentions';

// Pipes
import { TimestampPipe } from '../_pipes/timestamp.pipe';

// Routes
import { groupRoutes } from './group.routes';

// Routing Module
//import { GroupRoutingModule } from './group-routing.module';

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
		GroupDocumentComponent,
		TimestampPipe
	],
	providers: [ GroupResolver ],
	imports: [
		CommonModule,
		RouterModule.forChild(groupRoutes),
		MaterialsModule,
		//GroupRoutingModule,
		TranslateModule,
		CountdownModule,
		FontAwesomeModule,
		QuillModule.forRoot(),
		FieldsModule,
		FormsModule,
		ReactiveFormsModule,
		MentionModule
	]
})
export class GroupModule {}
