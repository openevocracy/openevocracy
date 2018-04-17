import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ReactiveFormsModule } from '@angular/forms';
import 'hammerjs';

// Modules
import { MaterialModule } from './_modules/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

// Routing
import { AppRoutingModule } from './_routing/app-routing.module';
import { PublicRoutingModule } from './_routing/public-routing.module';

// Components Global
import { AppComponent } from './app.component';
import { CountdownComponent } from './countdown/countdown.component';
import { AlertComponent } from './alert/alert.component';
import { ModalComponent } from './modals/modal.component';
import { ModalEmailComponent } from './modals/email/email.modal.component';
import { ModalAddtopicComponent } from './modals/addtopic/addtopic.modal.component';

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
import { TopicsListService } from './_services/topics-list.service';
import { TopicService } from './_services/topic.service';
import { HttpManagerService } from './_services/http-manager.service';
import { Guard } from './_services/guard.service';
import { UserService } from './_services/user.service';
import { AlertService } from './_services/alert.service';
import { ModalService } from './_services/modal.service';
import { EmailModalService } from './_services/modal.email.service';
import { UtilsService } from './_services/utils.service';

// Shared
//import { cfg } from './_shared/config';
import { cfg } from '../../shared/config';
import { C } from '../../shared/constants';
import { SettingsComponent } from './settings/settings.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http);
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
		SettingsComponent
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
		TopicsListService,
		TopicService,
		Guard,
		UserService,
		AlertService,
		ModalService,
		EmailModalService,
		UtilsService,
		{ provide: 'cfg', useValue: cfg },
		{ provide: 'C', useValue: C }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
