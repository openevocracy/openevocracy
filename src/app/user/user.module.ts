import { NgModule } from '@angular/core';

import { UserComponent } from './user.component';
import { UserprofileOverviewComponent } from './overview/overview.component';
import { UserprofileActivityComponent } from './activities/activities.component';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
	declarations: [
		UserComponent,
		UserprofileOverviewComponent,
		UserprofileActivityComponent,
		SettingsComponent
	]
})
export class UserModule {}
