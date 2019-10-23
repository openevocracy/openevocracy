import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import 'hammerjs';

// Modules
import { MaterialModule } from './_modules/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { QuillModule } from 'ngx-quill';
import { MentionModule } from 'angular-mentions';
//import { StarRatingModule } from 'angular-star-rating';

// Routing
import { AppRoutingModule } from './_routing/app-routing.module';
import { PublicRoutingModule } from './_routing/public-routing.module';

// Pipes
import { AddonePipe } from './_pipes/addone.pipe';
import { TimestampPipe } from './_pipes/timestamp.pipe';

// Components Global
import { AppComponent } from './app.component';
import { CountdownComponent } from './countdown/countdown.component';
import { AlertComponent } from './alert/alert.component';
import { ModalComponent } from './modals/modal.component';
import { ModalEmailComponent } from './modals/email/email.modal.component';
import { ModalAddtopicComponent } from './modals/addtopic/addtopic.modal.component';
import { ModalCloseeditorComponent } from './modals/closeeditor/closeeditor.modal.component';

// Components Public
import { PublicComponent } from './public/public.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

// Components Secure
import { SecureComponent } from './secure/secure.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { TopiclistComponent } from './topiclist/topiclist.component';
import { TopicComponent } from './topic/topic.component';

// Dialogs
import { ShareDialogComponent } from './dialogs/share/share.component';
import { FeedbackDialogComponent } from './dialogs/feedback/feedback.component';
import { EditThreadDialogComponent } from './dialogs/editthread/editthread.component';
import { AskDeleteDialogComponent } from './dialogs/askdelete/askdelete.component';
import { EditForumPostDialogComponent } from './dialogs/editforumpost/editforumpost.component';
import { EditForumCommentDialogComponent } from './dialogs/editforumcomment/editforumcomment.component';

// Services
import { TopicsListService } from './_services/topiclist.service';
import { TopicService } from './_services/topic.service';
import { HttpManagerService } from './_services/http-manager.service';
import { Guard } from './_services/guard.service';
import { UserService } from './_services/user.service';
import { AlertService } from './_services/alert.service';
import { ModalService } from './_services/modal.service';
import { EmailModalService } from './_services/modal.email.service';
import { CloseeditorModalService } from './_services/modal.closeeditor.service';
import { UtilsService } from './_services/utils.service';
import { LanguageService } from './_services/language.service';
import { ConfigService } from './_services/config.service';
import { SnackbarService } from './_services/snackbar.service';
import { ActivityListService } from './_services/activitylist.service';
import { ConnectionAliveService } from './_services/connection.service';

// Shared
import { cfg } from '../../shared/config';
import { C } from '../../shared/constants';

// Group
import { GroupEditorComponent } from './group/editor/editor.component';
import { GroupForumComponent } from './group/forum/forum.component';
import { GroupForumThreadComponent } from './group/forum/thread/thread.component';
import { GroupChatComponent } from './group/chat/chat.component';
import { GroupMembersComponent } from './group/members/members.component';
import { GroupToolbarComponent } from './group/toolbar/toolbar.component';

// New components (not sorted)
import { GroupvisComponent } from './groupvis/groupvis.component';
import { SettingsComponent } from './settings/settings.component';
import { EditorComponent } from './editor/editor.component';
import { PadviewComponent } from './padview/padview.component';
import { UserprofileComponent } from './userprofile/userprofile.component';
import { EditorFieldComponent } from './editorfield/editorfield.component';
import { GroupComponent } from './group/group.component';
import { GroupMemberbarComponent } from './group/memberbar/memberbar.component';
import { StarratingComponent } from './starrating/starrating.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http);
}

export function loadConfig(configService: ConfigService) {
	return () => configService.load();
}

@NgModule({
	declarations: [
		AppComponent,
		HeaderComponent,
		FooterComponent,
		TopiclistComponent,
		LoginComponent,
		PublicComponent,
		SecureComponent,
		AlertComponent,
		RegisterComponent,
		ModalComponent,
		ModalEmailComponent,
		ModalAddtopicComponent,
		TopicComponent,
		CountdownComponent,
		SettingsComponent,
		EditorComponent,
		ModalCloseeditorComponent,
		GroupEditorComponent,
		AddonePipe,
		TimestampPipe,
		GroupvisComponent,
		PadviewComponent,
		UserprofileComponent,
		ShareDialogComponent,
		FeedbackDialogComponent,
		GroupForumComponent,
		EditThreadDialogComponent,
		EditorFieldComponent,
		GroupForumThreadComponent,
		AskDeleteDialogComponent,
		EditForumPostDialogComponent,
		EditForumCommentDialogComponent,
		GroupChatComponent,
		GroupMembersComponent,
		GroupToolbarComponent,
		GroupComponent,
		GroupMemberbarComponent,
		StarratingComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		FontAwesomeModule,
		AppRoutingModule,
		PublicRoutingModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		QuillModule.forRoot(),
		MentionModule,
		//StarRatingModule.forRoot(),
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		})
	],
	providers: [
		HttpManagerService,
		ConfigService,
		//{ provide: ConfigService, useValue: ConfigService, deps: [HttpManagerService] },
		{ provide: APP_INITIALIZER, useFactory: loadConfig, deps: [ConfigService], multi: true },
		TopicsListService,
		TopicService,
		Guard,
		UserService,
		AlertService,
		ModalService,
		EmailModalService,
		CloseeditorModalService,
		UtilsService,
		LanguageService,
		SnackbarService,
		ActivityListService,
		ConnectionAliveService,
		//{ provide: 'cfg', useValue: cfg },
		/*{ provide: 'cfg',
		  useFactory: (configService: ConfigService) => () => Promise.resolve(configService.get()),
		  deps: [ConfigService]
		},*/
		{ provide: 'C', useValue: C }
	],
	entryComponents: [
		FeedbackDialogComponent,
		AskDeleteDialogComponent,
		EditForumPostDialogComponent,
		EditForumCommentDialogComponent,
		EditThreadDialogComponent,
		ShareDialogComponent
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
