import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import 'hammerjs';

// Modules
import { MaterialsModule } from './materials/materials.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { QuillModule } from 'ngx-quill';
import { MentionModule } from 'angular-mentions';
import { VisModule } from 'ngx-vis';
import { TopicModule } from './topic/topic.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';

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

// Components Public
import { PublicComponent } from './public/public.component';
import { LoginComponent } from './public/login/login.component';
import { RegisterComponent } from './public/register/register.component';

// Components Secure
import { SecureComponent } from './secure/secure.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { TopiclistComponent } from './topiclist/topiclist.component';

// Dialogs
import { ShareDialogComponent } from './dialogs/share/share.component';
import { FeedbackDialogComponent } from './dialogs/feedback/feedback.component';
import { EditThreadDialogComponent } from './dialogs/editthread/editthread.component';
import { AskDeleteDialogComponent } from './dialogs/askdelete/askdelete.component';
import { EditForumPostDialogComponent } from './dialogs/editforumpost/editforumpost.component';
import { EditForumCommentDialogComponent } from './dialogs/editforumcomment/editforumcomment.component';
import { GroupWelcomeDialogComponent } from './dialogs/groupwelcome/groupwelcome.component';
import { AddtopicDialogComponent } from './dialogs/addtopic/addtopic.component';
import { CloseEditorDialogComponent } from './dialogs/closeeditor/closeeditor.component';
import { ProposalDialogComponent } from './dialogs/proposal/proposal.component';

// Services
import { TopicsListService } from './_services/topiclist.service';
import { TopicService } from './_services/topic.service';
import { HttpManagerService } from './_services/http-manager.service';
import { Guard } from './_services/guard.service';
import { UserService } from './_services/user.service';
import { AlertService } from './_services/alert.service';
import { UtilsService } from './_services/utils.service';
import { LanguageService } from './_services/language.service';
import { ConfigService } from './_services/config.service';
import { SnackbarService } from './_services/snackbar.service';
import { ActivityListService } from './_services/activitylist.service';
import { ConnectionAliveService } from './_services/connection.service';
import { LineNumbersService } from './_editor/linenumbers.service';

// Shared
import { cfg } from '../../shared/config';
import { C } from '../../shared/constants';

// New components (not sorted)
import { EditorComponent } from './editor/editor.component';
//import { PadviewComponent } from './padview/padview.component';
import { EditorFieldComponent } from './editorfield/editorfield.component';
import { StarratingComponent } from './starrating/starrating.component';
import { LoginEmailDialogComponent } from './dialogs/loginemail/loginemail.component';

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
		CountdownComponent,
		EditorComponent,
		AddonePipe,
		TimestampPipe,
		//PadviewComponent,
		ShareDialogComponent,
		FeedbackDialogComponent,
		EditThreadDialogComponent,
		EditorFieldComponent,
		AskDeleteDialogComponent,
		EditForumPostDialogComponent,
		EditForumCommentDialogComponent,
		GroupWelcomeDialogComponent,
		StarratingComponent,
		AddtopicDialogComponent,
		CloseEditorDialogComponent,
		LoginEmailDialogComponent,
		ProposalDialogComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialsModule,
		FontAwesomeModule,
		AppRoutingModule,
		PublicRoutingModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		QuillModule.forRoot(),
		MentionModule,
		VisModule,
		TopicModule,
		UserModule,
		GroupModule,
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
		{ provide: APP_INITIALIZER, useFactory: loadConfig, deps: [ConfigService], multi: true },
		TopicsListService,
		TopicService,
		Guard,
		UserService,
		AlertService,
		UtilsService,
		LanguageService,
		SnackbarService,
		ActivityListService,
		ConnectionAliveService,
		LineNumbersService,
		{ provide: 'C', useValue: C }
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
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
