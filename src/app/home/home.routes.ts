import { Routes } from '@angular/router';

import { TopiclistComponent } from './topiclist/topiclist.component';

const homeRoutes: Routes = [
	{ path: '', redirectTo: 'topiclist', pathMatch: 'full' },
	{ path: 'topiclist', component: TopiclistComponent }
];

export { homeRoutes };
