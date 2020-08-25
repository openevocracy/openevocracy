import { Routes } from '@angular/router';

import { UserprofileOverviewComponent } from '../user/overview/overview.component';
import { UserprofileActivityComponent } from '../user/activities/activities.component';

const userRoutes: Routes = [
	{ path: '', redirectTo: 'overview', pathMatch: 'full' },
	{ path: 'overview', component: UserprofileOverviewComponent },
	{ path: 'activity', component: UserprofileActivityComponent }
];

export { userRoutes };
