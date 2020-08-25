import { Routes } from '@angular/router';

import { TopicOverviewComponent } from '../topic/overview/overview.component';
import { TopicProposalComponent } from '../topic/proposal/proposal.component';
import { TopicGroupsComponent } from '../topic/groups/groups.component';

const topicRoutes: Routes = [
	{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	{ path: 'overview', component: TopicOverviewComponent },
	{ path: 'proposal', component: TopicProposalComponent },
	{ path: 'groups', component: TopicGroupsComponent }
];

export { topicRoutes };
