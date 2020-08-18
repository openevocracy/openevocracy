import { Routes } from '@angular/router';

import { LoginComponent } from '../public/login/login.component';
import { RegisterComponent } from '../public/register/register.component';

const PublicChildRoutes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full', },
	{ path: 'login', pathMatch: 'full', component: LoginComponent },
	{ path: 'register', pathMatch: 'full', component: RegisterComponent }
];

export { PublicChildRoutes };
