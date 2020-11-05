import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TopicResolver } from './topic.resolver';

// Components
import { TopicComponent } from './topic.component';
import { TopicToolbarComponent } from './toolbar/toolbar.component';
import { TopicOverviewComponent } from './overview/overview.component';
import { TopicProposalComponent } from './proposal/proposal.component';
import { TopicGroupsComponent } from './groups/groups.component';
import { TopicStagebarComponent } from './stagebar/stagebar.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuillModule } from 'ngx-quill';
import { VisModule } from 'ngx-vis';
import { CountdownModule } from '../countdown/countdown.module';
import { MaterialsModule } from '../materials/materials.module';

// Routes
import { topicRoutes } from './topic.routes';

// Routing Module
//import { TopicRoutingModule } from './topic-routing.module';

@NgModule({
	declarations: [
		TopicComponent,
		TopicToolbarComponent,
		TopicOverviewComponent,
		TopicProposalComponent,
		TopicGroupsComponent,
		TopicStagebarComponent
	],
	providers: [ TopicResolver ],
	imports: [
		CommonModule,
		RouterModule.forChild(topicRoutes),
		//TopicRoutingModule,
		TranslateModule,
		FontAwesomeModule,
		CountdownModule,
		MaterialsModule,
		QuillModule.forRoot(),
		VisModule
	]
})
export class TopicModule {}
