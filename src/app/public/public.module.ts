import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Components
import { PublicComponent } from './public.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';
import { AlertModule } from '../alert/alert.module';

// Routes
//import { publicRoutes } from './public.routes';

// Routing Module
//import { PublicRoutingModule } from './public-routing.module';

@NgModule({
	declarations: [
		PublicComponent,
		RegisterComponent,
		LoginComponent
	],
	imports: [
		CommonModule,
		RouterModule,//.forChild(publicRoutes),
		//PublicRoutingModule,
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
