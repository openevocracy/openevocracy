import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { Guard } from './_services/guard.service';

import { publicRoutes } from './public/public.routes';
import { secureRoutes } from './secure/secure.routes';

import { SecureComponent } from './secure/secure.component';
import { PublicComponent } from './public/public.component';

const appRoutes: Routes = [
	{
		path: '',
		component: PublicComponent,
		children: publicRoutes
		//loadChildren: './public/public.module#PublicModule'
	},
	{
		path: '',
		component: SecureComponent,
		canActivate: [Guard],
		children: secureRoutes
		//loadChildren: './secure/secure.module#SecureModule'
	}
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
