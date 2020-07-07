import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { TopiclistComponent } from './topiclist/topiclist.component';

// Modules
//import { TranslateModule } from '@ngx-translate/core';
//import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
//import { MaterialsModule } from '../materials/materials.module';

// Routing Module
import { HomeRoutingModule } from '../_routing/home-routing.module';

@NgModule({
	declarations: [
		TopiclistComponent
	],
	exports: [
		TopiclistComponent
	],
	imports: [
		CommonModule,
		//TranslateModule,
		//FontAwesomeModule,
		//MaterialsModule,
		HomeRoutingModule
	]
})
export class HomeModule {}
