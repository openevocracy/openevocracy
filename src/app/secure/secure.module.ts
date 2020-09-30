import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SecureComponent } from './secure.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';

// Routes
//import { secureRoutes } from './secure.routes';

// Routing Module
//import { SecureRoutingModule } from './secure-routing.module';

@NgModule({
	declarations: [
		HeaderComponent,
		FooterComponent,
		SecureComponent
	],
	exports: [
		HeaderComponent,
		FooterComponent,
		SecureComponent
	],
	imports: [
		CommonModule,
		RouterModule,//.forChild(secureRoutes),
		TranslateModule,
		FontAwesomeModule,
		MaterialsModule,
		//SecureRoutingModule
	]
})
export class SecureModule {}
