import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { PublicComponent } from './public.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';
import { AlertModule } from '../alert/alert.module';

// Routing Module
import { PublicRoutingModule } from '../_routing/public-routing.module';

@NgModule({
	declarations: [
		PublicComponent,
		RegisterComponent,
		LoginComponent
	],
	imports: [
		CommonModule,
		PublicRoutingModule,
		FormsModule,
		ReactiveFormsModule,
		//UserRoutingModule,
		TranslateModule,
		MaterialsModule,
		FontAwesomeModule,
		AlertModule
	]
})
export class PublicModule {}
