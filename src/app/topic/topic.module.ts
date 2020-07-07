import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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

// Routing Module
import { TopicRoutingModule } from '../_routing/topic-routing.module';

@NgModule({
	declarations: [
		TopicComponent,
		TopicToolbarComponent,
		TopicOverviewComponent,
		TopicProposalComponent,
		TopicGroupsComponent,
		TopicStagebarComponent
	],
	imports: [
		CommonModule,
		TopicRoutingModule,
		TranslateModule,
		FontAwesomeModule,
		CountdownModule,
		MaterialsModule,
		QuillModule.forRoot(),
		VisModule
	]
})
export class TopicModule {}
