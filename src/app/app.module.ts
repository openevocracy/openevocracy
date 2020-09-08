import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import 'hammerjs';

// Contrib Modules
import { MaterialsModule } from './materials/materials.module';

// Custom Modules
import { HomeModule } from './home/home.module';
import { TopicModule } from './topic/topic.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { PublicModule } from './public/public.module';
import { DialogsModule } from './dialogs/dialogs.module';
import { SecureModule } from './secure/secure.module';
import { EditorModule } from './editor/editor.module';

// App
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

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
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		MaterialsModule,
		AppRoutingModule,
		HttpClientModule,
		HomeModule,
		TopicModule,
		UserModule,
		GroupModule,
		PublicModule,
		SecureModule,
		DialogsModule,
		EditorModule,
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
	entryComponents: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
