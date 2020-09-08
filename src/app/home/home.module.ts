import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Pipes
import { AddonePipe } from '../_pipes/addone.pipe';

// Components
import { HomeComponent } from './home.component';
import { TopiclistComponent } from './topiclist/topiclist.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';
import { AlertModule } from '../alert/alert.module';
import { CountdownModule } from '../countdown/countdown.module';

// Routes
import { homeRoutes } from './home.routes';

// Routing Module
//import { HomeRoutingModule } from './home-routing.module';

@NgModule({
	declarations: [
		TopiclistComponent,
		HomeComponent,
		AddonePipe
	],
	imports: [
		CommonModule,
		RouterModule.forChild(homeRoutes),
		TranslateModule,
		FontAwesomeModule,
		MaterialsModule,
		//HomeRoutingModule,
		AlertModule,
		CountdownModule
	]
})
export class HomeModule {}
