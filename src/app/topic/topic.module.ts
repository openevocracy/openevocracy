import { NgModule } from '@angular/core';

import { TopicComponent } from './topic.component';
import { TopicToolbarComponent } from './toolbar/toolbar.component';
import { TopicOverviewComponent } from './overview/overview.component';
import { TopicProposalComponent } from './proposal/proposal.component';
import { TopicGroupsComponent } from './groups/groups.component';
import { TopicStagebarComponent } from './stagebar/stagebar.component';

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
		TopicRoutingModule
	]
})
export class TopicModule {}
