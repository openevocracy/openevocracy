import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { trigger, transition, group, animate, style, state } from '@angular/animations'
import { forkJoin } from 'rxjs/observable/forkJoin';

import { VisNetworkService, Data, DataSet, Node, Options, Edge } from 'ngx-vis';

import { UtilsService } from '../../_services/utils.service';
import { HttpManagerService } from '../../_services/http-manager.service';

import { faPlay } from '@fortawesome/free-solid-svg-icons';

import * as $ from 'jquery';
import * as _ from 'underscore';

@Component({
	selector: 'app-groups',
	templateUrl: './groups.component.html',
	styleUrls: ['./groups.component.scss'],
	animations: [
		trigger('slideInOut', [
			state('in', style({})),
			state('out', style({ opacity: '0' })),
			transition('in => out', animate('300ms')),
			transition('out => in', animate('300ms'))
		])
	]
})
export class TopicGroupsComponent implements OnInit, OnDestroy {
	
	public topicId: string;
	
	public faPlay = faPlay;
	
	public detail;
	public detailStatus: string = 'out';
	
	public meColor = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457'};
	public proposalColor = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A'};
	public groupColor = { 'background': '#3F51B5', 'border': '#3F51B5', 'hover': '#7986CB', 'highlight': '#283593' };
	
	public visNetwork: string = 'groupvis';
	public visNetworkData: Data;
	public nodes; //: DataSet<Node>;
	public edges; //: DataSet<Edge>;
	public visNetworkOptions: Options;

	constructor(
		private router: Router,
		private utilsService: UtilsService,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService,
		private visNetworkService: VisNetworkService
	) { }
	
	public ngOnInit(): void {
		// Get topicId from route
		this.topicId = this.router.url.split('/')[2];
		
		// Get nodes and edges of group hierarchy from server
		this.httpManagerService.get('/json/groupvis/'+this.topicId).subscribe(this.drawGraph.bind(this));
	}
	
	public ngOnDestroy(): void {
		// De-register events
		this.visNetworkService.off(this.visNetwork, 'hoverNode');
		this.visNetworkService.off(this.visNetwork, 'blurNode');
		this.visNetworkService.off(this.visNetwork, 'selectNode');
		this.visNetworkService.off(this.visNetwork, 'deselectNode');
	}
	
	public networkInitialized(): void {
		//this.addGraphEvents();
		
		// Register events
		this.visNetworkService.on(this.visNetwork, 'hoverNode');
		this.visNetworkService.on(this.visNetwork, 'blurNode');
		this.visNetworkService.on(this.visNetwork, 'selectNode');
		this.visNetworkService.on(this.visNetwork, 'deselectNode');
		
		// Set cursor to pointer on hovering a node
		this.visNetworkService.hoverNode.subscribe((eventData: any[]) => {
			// If event comes not from groupvis figure, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			eventData[1].event.target.style.cursor = 'pointer';
		});
		
		// Reset cursor to default on bluring a node
		this.visNetworkService.blurNode.subscribe((eventData: any[]) => {
			// If event comes not from groupvis figure, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			eventData[1].event.target.style.cursor = 'default';
		});
		
		// When clicking on a node
		this.visNetworkService.selectNode.subscribe((eventData: any[]) => {
			// If event comes not from groupvis figure, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			// Animate box out
			this.detailStatus = 'out';
		
			const id = eventData[1].nodes[0];
			const node = this.nodes.get(id);
			
			let httpObservable;
			if(node.level == -1) {
				// We have a proposal
				httpObservable = this.httpManagerService.get('/json/groupvis/proposal/'+id);
			} else {
				// We have a group
				httpObservable = this.httpManagerService.get('/json/groupvis/group/'+id);
			}
			
			// Get data from http observable
			httpObservable.subscribe(res => {
				const type = (node.level == -1 ? 'proposal' : 'group');
				this.detail = { ...res, 'type': type };
			});
			
			// Animate box in
			setTimeout(() => {
				this.detailStatus = 'in';
			}, 300);
		});
		
		this.visNetworkService.deselectNode.subscribe((eventData: any[]) => {
			// If event comes not from groupvis figure, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			// Remove detail information
			this.detail = undefined;
			
			// Animate box out
			this.detailStatus = 'out';
		});
  }
	
	/**
	 * @desc: Initially draw graph
	 */
	private drawGraph(res): void {
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
						'label': labelGroup+' '+node.name,
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
		});
	}
	
	/**
	 * @desc: Adds events to graph
	 */
	private addGraphEvents(): void {
		
	}
	
	/**
	 * @desc: Define options of the graph
	 */
	private getGraphOptions(): any {
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
				'arrows': {
					'to' : {
						'enabled': true,
						'scaleFactor': 0.5
					}
				},
				'width': 2,
				'chosen': false
			}
      };
	}

}
