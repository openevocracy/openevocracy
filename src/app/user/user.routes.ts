import { Routes } from '@angular/router';

import { UserprofileOverviewComponent } from './overview/overview.component';
import { UserprofileActivityComponent } from './activities/activities.component';

const userRoutes: Routes = [
	{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	{ path: 'overview', component: UserprofileOverviewComponent },
	{ path: 'activity', component: UserprofileActivityComponent }
];

export { userRoutes };
