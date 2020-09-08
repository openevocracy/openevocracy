import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { UserComponent } from './user.component';
import { UserprofileOverviewComponent } from './overview/overview.component';
import { UserprofileActivityComponent } from './activities/activities.component';
import { SettingsComponent } from './settings/settings.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';
import { AlertModule } from '../alert/alert.module';

// Routes
import { userRoutes } from './user.routes';

// Routing Module
//import { UserRoutingModule } from './user-routing.module';

@NgModule({
	declarations: [
		UserComponent,
		UserprofileOverviewComponent,
		UserprofileActivityComponent,
		SettingsComponent
	],
	imports: [
		CommonModule,
		RouterModule.forChild(userRoutes),
		FormsModule,
		ReactiveFormsModule,
		//UserRoutingModule,
		TranslateModule,
		MaterialsModule,
		FontAwesomeModule,
		AlertModule
	]
})
export class UserModule {}
