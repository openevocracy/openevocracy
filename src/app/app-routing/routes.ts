import { Routes } from '@angular/router';

import { TopicsComponent } from '../topics/topics.component';

export const routes: Routes = [
  { path: 'topics',    component: TopicsComponent },
  //{ path: 'topic/:id', component: MenuComponent },
  { path: '', redirectTo: '/topics', pathMatch: 'full' }
];
