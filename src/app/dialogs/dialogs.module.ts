import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { ShareDialogComponent } from './share/share.component';
import { FeedbackDialogComponent } from './feedback/feedback.component';
import { EditThreadDialogComponent } from './editthread/editthread.component';
import { AskDeleteDialogComponent } from './askdelete/askdelete.component';
import { EditForumPostDialogComponent } from './editforumpost/editforumpost.component';
import { EditForumCommentDialogComponent } from './editforumcomment/editforumcomment.component';
import { GroupWelcomeDialogComponent } from './groupwelcome/groupwelcome.component';
import { AddtopicDialogComponent } from './addtopic/addtopic.component';
import { CloseEditorDialogComponent } from './closeeditor/closeeditor.component';
import { ProposalDialogComponent } from './proposal/proposal.component';
import { LoginEmailDialogComponent } from './loginemail/loginemail.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { MaterialsModule } from '../materials/materials.module';
import { FieldsModule } from '../fields/fields.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
	declarations: [
		ShareDialogComponent,
		FeedbackDialogComponent,
		EditThreadDialogComponent,
		AskDeleteDialogComponent,
		EditForumPostDialogComponent,
		EditForumCommentDialogComponent,
		GroupWelcomeDialogComponent,
		AddtopicDialogComponent,
		CloseEditorDialogComponent,
		ProposalDialogComponent,
		LoginEmailDialogComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		MaterialsModule,
		FieldsModule,
		FontAwesomeModule
	],
	entryComponents: [
		FeedbackDialogComponent,
		AskDeleteDialogComponent,
		EditForumPostDialogComponent,
		EditForumCommentDialogComponent,
		EditThreadDialogComponent,
		ShareDialogComponent,
		GroupWelcomeDialogComponent,
		AddtopicDialogComponent,
		CloseEditorDialogComponent,
		LoginEmailDialogComponent,
		ProposalDialogComponent
	]
})
export class DialogsModule {}
