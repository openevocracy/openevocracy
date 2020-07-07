import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { SecureRoutingModule } from './secure-routing.module';

import { PublicComponent } from '../public/public.component';
import { LoginComponent } from '../public/login/login.component';
import { RegisterComponent } from '../public/register/register.component';

const publicChildRoutes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full', },
	{ path: 'login', pathMatch: 'full', component: LoginComponent },
	{ path: 'register', pathMatch: 'full', component: RegisterComponent }
];

const publicRoutes: Routes = [
	{ path: '', component: PublicComponent, children: publicChildRoutes },
	{ path: '', loadChildren: () => import('./secure-routing.module').then(m => m.SecureRoutingModule)/*, data: { preload: true }*/ }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(publicRoutes/*, {
      	preloadingStrategy: PreloadAllModules
   	}*/),
		SecureRoutingModule
	],
	exports: [ RouterModule ],
	declarations: []
})
export class PublicRoutingModule { }
