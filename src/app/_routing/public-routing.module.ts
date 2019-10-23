import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';

import { PublicComponent } from '../public/public.component';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';

const publicChildRoutes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full', },
	{ path: 'login', pathMatch: 'full', component: LoginComponent },
	{ path: 'register', pathMatch: 'full', component: RegisterComponent }
];

const publicRoutes: Routes = [
	{ path: '', component: PublicComponent, children: publicChildRoutes },
	{ path: '', loadChildren: () => import('./app-routing.module').then(m => m.AppRoutingModule)/*, data: { preload: true }*/ }
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forRoot(publicRoutes/*, {
      	preloadingStrategy: PreloadAllModules
   	}*/),
		AppRoutingModule
	],
	exports: [ RouterModule ],
	declarations: []
})
export class PublicRoutingModule { }
