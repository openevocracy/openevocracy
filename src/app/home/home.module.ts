import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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

// Routing Module
import { HomeRoutingModule } from '../_routing/home-routing.module';

@NgModule({
	declarations: [
		TopiclistComponent,
		HomeComponent,
		AddonePipe
	],
	/*exports: [
		TopiclistComponent
	],*/
	imports: [
		CommonModule,
		TranslateModule,
		FontAwesomeModule,
		MaterialsModule,
		HomeRoutingModule,
		AlertModule,
		CountdownModule
	]
})
export class HomeModule {}
