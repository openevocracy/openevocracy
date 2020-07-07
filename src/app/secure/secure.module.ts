import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SecureComponent } from './secure.component';

// Modules
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialsModule } from '../materials/materials.module';

// Routing Module
import { SecureRoutingModule } from '../_routing/secure-routing.module';

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
		TranslateModule,
		FontAwesomeModule,
		MaterialsModule,
		SecureRoutingModule
	]
})
export class SecureModule {}
