import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { Guard } from '../_services/guard.service';

import { TopicResolver } from '../_resolver/topic.resolver';

//import { SecureComponent } from '../secure/secure.component';

import { TopicComponent } from '../topic/topic.component';
import { TopicOverviewComponent } from '../topic/overview/overview.component';
import { TopicProposalComponent } from '../topic/proposal/proposal.component';
import { TopicGroupsComponent } from '../topic/groups/groups.component';

const topicChildRoutes: Routes = [
	{
		path: 'topic/:id',
		component: TopicComponent,
		resolve: { 'manageTopic': TopicResolver },
		runGuardsAndResolvers: 'always',
		children: [
			{ path: '', redirectTo: 'overview', pathMatch: 'full' },
			{ path: 'overview', component: TopicOverviewComponent },
			{ path: 'proposal', component: TopicProposalComponent },
			{ path: 'groups', component: TopicGroupsComponent }
		]
	}
];

/*const topicRoutes: Routes = [
	{ path: '', component: SecureComponent, canActivate: [Guard], children: topicChildRoutes }
];*/

@NgModule({
	imports: [
		CommonModule,
		/*RouterModule.forRoot(topicRoutes, {
			scrollPositionRestoration: 'enabled',
			anchorScrolling: 'enabled',
			onSameUrlNavigation: 'reload'
		})*/
		RouterModule.forChild(topicChildRoutes)
	],
	exports: [ RouterModule ],
	providers: [ TopicResolver ],
	declarations: []
})
export class TopicRoutingModule { }
