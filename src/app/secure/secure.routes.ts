import { Routes } from '@angular/router';

// Resolver
import { GroupResolver } from '../group/group.resolver';
import { TopicResolver } from '../topic/topic.resolver';

// Components
import { HomeComponent } from '../home/home.component';
import { TopicComponent } from '../topic/topic.component';
import { GroupComponent } from '../group/group.component';
import { UserComponent } from '../user/user.component';
import { SettingsComponent } from '../user/settings/settings.component';

// Routes
//import { homeRoutes } from '../home/home.routes';
//import { topicRoutes } from '../topic/topic.routes';
//import { groupRoutes } from '../group/group.routes';
//import { userRoutes } from '../user/user.routes';

const secureRoutes: Routes = [
	{
		path: '',
		component: HomeComponent,
		runGuardsAndResolvers: 'always',
		//children: homeRoutes
		loadChildren: '../home/home.module#HomeModule'
	},
	{
		path: 'topic/:id',
		component: TopicComponent,
		resolve: { 'manageTopic': TopicResolver },
		runGuardsAndResolvers: 'always',
		//children: topicRoutes
		loadChildren: '../topic/topic.module#TopicModule'
	},
	{
		path: 'group/:id',
		component: GroupComponent,
		resolve: { 'basicGroup': GroupResolver },
		runGuardsAndResolvers: 'always',
		//children: groupRoutes
		loadChildren: '../group/group.module#GroupModule'
	},
	{
		path: 'user/:id',
		component: UserComponent,
		runGuardsAndResolvers: 'always',
		//children: userRoutes
		loadChildren: '../user/user.module#UserModule'
	},
	{ path: 'settings', component: SettingsComponent } //{ path: 'settings/:id', component: SettingsComponent }
];

export { secureRoutes };
