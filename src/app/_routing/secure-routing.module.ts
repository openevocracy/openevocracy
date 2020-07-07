import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { Guard } from '../_services/guard.service';

import { SecureComponent } from '../secure/secure.component';

const secureChildRoutes: Routes = [];

const secureRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: secureChildRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(secureRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload',
      	//preloadingStrategy: PreloadAllModules
   	})
	],
	exports: [ RouterModule ],
	declarations: []
})
export class SecureRoutingModule { }
