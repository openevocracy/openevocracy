import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { Guard } from '../_services/guard.service';

//import { SecureRoutingModule } from './secure-routing.module';
//import { PublicRoutingModule } from './public-routing.module';

import { publicRoutes } from './public.routes';
import { secureRoutes } from './secure.routes';

//import { AppComponent } from '../app.component';

import { SecureComponent } from '../secure/secure.component';
import { PublicComponent } from '../public/public.component';

const appRoutes: Routes = [
	{ path: '', component: PublicComponent, children: publicRoutes },
	{ path: '', component: SecureComponent, canActivate: [Guard], children: secureRoutes }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(appRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload',
      	//preloadingStrategy: PreloadAllModules
   	})
	],
	exports: [ RouterModule ],
	declarations: []
})
export class AppRoutingModule { }
