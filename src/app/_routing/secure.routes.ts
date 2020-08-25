import { Routes } from '@angular/router';

// Resolver
import { GroupResolver } from '../_resolver/group.resolver';
import { TopicResolver } from '../_resolver/topic.resolver';

// Components
import { HomeComponent } from '../home/home.component';
import { TopicComponent } from '../topic/topic.component';
import { GroupComponent } from '../group/group.component';
import { UserComponent } from '../user/user.component';
import { SettingsComponent } from '../user/settings/settings.component';

// Routes
import { homeRoutes } from './home.routes';
import { topicRoutes } from './topic.routes';
import { groupRoutes } from './group.routes';
import { userRoutes } from './user.routes';

const secureRoutes: Routes = [
	{
		path: '',
		component: HomeComponent,
		runGuardsAndResolvers: 'always',
		children: homeRoutes
	},
	{
		path: 'topic/:id',
		component: TopicComponent,
		resolve: { 'manageTopic': TopicResolver },
		runGuardsAndResolvers: 'always',
		children: topicRoutes
	},
	{
		path: 'group/:id',
		component: GroupComponent,
		resolve: { 'basicGroup': GroupResolver },
		runGuardsAndResolvers: 'always',
		children: groupRoutes
	},
	{
		path: 'user/:id',
		component: UserComponent,
		runGuardsAndResolvers: 'always',
		children: userRoutes
	},
	{ path: 'settings', component: SettingsComponent } //{ path: 'settings/:id', component: SettingsComponent }
];

export { secureRoutes };
