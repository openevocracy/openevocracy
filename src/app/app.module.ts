import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ReactiveFormsModule } from '@angular/forms';
import 'hammerjs';

// Modules
import { MaterialModule } from './_modules/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { QuillModule } from 'ngx-quill';
import { StarRatingModule } from 'angular-star-rating';

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

// Shared
import { cfg } from '../../shared/config';
import { C } from '../../shared/constants';
import { SettingsComponent } from './settings/settings.component';
import { EditorComponent } from './editor/editor.component';
import { GroupComponent } from './group/group.component';
import { GroupvisComponent } from './groupvis/groupvis.component';
import { PadviewComponent } from './padview/padview.component';
import { UserprofileComponent } from './userprofile/userprofile.component';
import { ShareDialogComponent } from './dialogs/share/share.component';
import { GroupForumComponent } from './groupforum/groupforum.component';
import { NewThreadDialogComponent } from './dialogs/newthread/newthread.component';
import { EditorFieldComponent } from './editorfield/editorfield.component';

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
		GroupComponent,
		AddonePipe,
		TimestampPipe,
		GroupvisComponent,
		PadviewComponent,
		UserprofileComponent,
		ShareDialogComponent,
		GroupForumComponent,
		NewThreadDialogComponent,
		EditorFieldComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialModule,
		FontAwesomeModule,
		AppRoutingModule,
		PublicRoutingModule,
		HttpModule,
		HttpClientModule,
		ReactiveFormsModule,
		QuillModule,
		StarRatingModule.forRoot(),
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
		//{ provide: 'cfg', useValue: cfg },
		/*{ provide: 'cfg',
		  useFactory: (configService: ConfigService) => () => Promise.resolve(configService.get()),
		  deps: [ConfigService]
		},*/
		{ provide: 'C', useValue: C }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
