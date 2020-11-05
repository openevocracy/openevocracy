import { Routes } from '@angular/router';

import { TopicOverviewComponent } from './overview/overview.component';
import { TopicProposalComponent } from './proposal/proposal.component';
import { TopicGroupsComponent } from './groups/groups.component';

const topicRoutes: Routes = [
	{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	{ path: 'overview', component: TopicOverviewComponent },
	{ path: 'proposal', component: TopicProposalComponent },
	{ path: 'groups', component: TopicGroupsComponent }
];

export { topicRoutes };
