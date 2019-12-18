//import { Component, OnInit } from '@angular/core';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { trigger, transition, group, animate, style, state } from '@angular/animations'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Router } from '@angular/router';

import { VisNetworkService, Data, DataSet, Node, Options, Edge } from 'ngx-vis';

import { UtilsService } from '../../_services/utils.service';
import { HttpManagerService } from '../../_services/http-manager.service';

import * as $ from 'jquery';
import * as _ from 'underscore';

@Component({
	selector: 'app-groups',
	templateUrl: './groups.component.html',
	styleUrls: ['./groups.component.scss'],
	animations: [
		trigger('slideInOut', [
			state('in', style({
				overflow: 'hidden', height: '*'
			})),
			state('out', style({
				opacity: '0', overflow: 'hidden', height: '0px'
			})),
			transition('in => out', animate('400ms')),
			transition('out => in', animate('400ms'))
		])
	]
})
export class TopicGroupsComponent implements OnInit, OnDestroy {
	
	//public nodes;
	public network;
	public detail;
	public detailStatus: string = 'out';
	
	public meColor = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457'};
	public proposalColor = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A'};
	public groupColor = { 'background': '#3F51B5', 'border': '#3F51B5', 'hover': '#7986CB', 'highlight': '#283593' };
	
	public topicId: string;
	
	public visNetwork: string = 'networkId1';
	public visNetworkData: Data;
	public nodes: DataSet<Node>;
	public edges: DataSet<Edge>;
	public visNetworkOptions: Options;

	constructor(
		private router: Router,
		private utilsService: UtilsService,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private visNetworkService: VisNetworkService
	) { }
	
	public ngOnInit() {
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		this.httpManagerService.get('/json/groupvis/'+this.topicId).subscribe(this.drawGraph.bind(this));
		
		// Fit network on resize
		/*$(window).on('resize', _.debounce(function() {
			this.network.fit();
		}.bind(this), 500));*/
		
		
	}
	
	public ngOnDestroy(): void {
		this.visNetworkService.off(this.visNetwork, 'click');
	}
	
	public networkInitialized(): void {
		// now we can use the service to register on events
		this.visNetworkService.on(this.visNetwork, 'click');
		
		// open your console/dev tools to see the click params
		this.visNetworkService.click.subscribe((eventData: any[]) => {
			if (eventData[0] === this.visNetwork) {
				console.log(eventData[1]);
			}
		});
  }
	
	/**
	 * @desc: Initially draw graph
	 */
	private drawGraph(res) {
		// Define container and options
		//let container = document.getElementById('graph');
      const options = this.getGraphOptions();
      
      // Get labels, finally extend data and finally draw graph
		forkJoin(
			this.translateService.get("GROUPVIS_PROPOSAL_LABEL"),
			this.translateService.get("GROUPVIS_GROUP_LABEL"))
		.subscribe(([labelProposal, labelGroup]) => {
			// Extend data
			const nodes = _.map(res.nodes, function(node) {
				if(node.level == -1) {
					return _.extend(node, {
						'label': labelProposal+' '+this.utilsService.getShortId(node.id),
						'color': node.me ? this.meColor : this.proposalColor
					});
				} else {
					return _.extend(node, {
						'label': labelGroup+' '+this.utilsService.getShortId(node.id),
						'color': node.me ? this.meColor : this.groupColor
					});
				}
			}.bind(this));
			
			// Create network graph
			//let data = { 'nodes': this.nodes, 'edges': res.edges };
      	//this.network = new Network(container, data, options);
      	
      	this.nodes = new DataSet<Node>(nodes);
			
			this.edges = new DataSet<Edge>(res.edges);
			
			this.visNetworkData = { 'nodes': this.nodes, 'edges': this.edges };
			
			this.visNetworkOptions = options;
      	
      	//this.addGraphEvents();
		});
	}
	
	/**
	 * @desc: Add events to graph
	 */
	private addGraphEvents() {
		this.network.on("hoverNode", function (params) {
			this.network.canvas.body.container.style.cursor = 'pointer';	
		}.bind(this));
		
		this.network.on("blurNode", function (params) {
			this.network.canvas.body.container.style.cursor = 'default';
		}.bind(this));
		
		this.network.on("selectNode", function (params) {
			this.detailStatus = 'out';
			
			setTimeout(function() {
				var id = params.nodes[0];
				var shortId = this.utilsService.getShortId(id);
				var node = _.findWhere(this.nodes, {'id': id});
				
				if(node.level == -1) {
					// We have a proposal
					this.httpManagerService.get('/json/groupvis/proposal/'+id).subscribe(res => {
						this.detail = _.extend(res, { 'type': 'proposal', 'shortPadId': shortId });
					});
				} else {
					// We have a group
					this.httpManagerService.get('/json/groupvis/group/'+id).subscribe(res => {
						this.detail = _.extend(res, { 'type': 'group', 'shortPadId': shortId });
					});
				}
				
				// Animate box in
				this.detailStatus = 'in';
			}.bind(this), 300);
		}.bind(this));
		
		this.network.on("deselectNode", function (params) {
			// Animate box out
			this.detailStatus = 'out';
		}.bind(this));
	}
	
	/**
	 * @desc: Define options of the graph
	 */
	private getGraphOptions() {
		return {
			'layout':{
				'hierarchical': {
					'enabled': true,
					'direction': 'DU'
				}
			},
			'interaction':{
				'dragNodes': false,
				'hover': true,
				'navigationButtons': true
			},
			'nodes': {
				'shape': 'box',
				'shapeProperties': {
					'borderRadius': 1
				},
				'color': this.groupColor,
				'heightConstraint': {
					'minimum': 28
				},
				'labelHighlightBold': false,
				'font': {
					'color': '#fff',
					'face': 'Roboto'
				},
				'shadow': {
					'enabled': true,
					'color': 'rgba(0,0,0,0.5)',
					'size': 3,
					'x': 0,
					'y': 2
				}
			},
			'edges': {
				'arrows': 'to',
				'width': 2,
				'chosen': false
			}
      };
	}

}
