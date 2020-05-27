import { NgModule } from '@angular/core';

import { UserComponent } from './user.component';
import { UserprofileOverviewComponent } from './overview/overview.component';
import { UserprofileActivityComponent } from './activities/activities.component';
import { SettingsComponent } from './settings/settings.component';

import { UserRoutingModule } from '../_routing/user-routing.module';

@NgModule({
	declarations: [
		UserComponent,
		UserprofileOverviewComponent,
		UserprofileActivityComponent,
		SettingsComponent
	],
	imports: [
		UserRoutingModule
	]
})
export class UserModule {}
