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
		trigger('fadeInOut', [
			state('1', style({ display: 'block', opacity: '1' })),
			state('0', style({ display: 'none', opacity: '0' })),
			transition('1 => 0', animate('200ms')),
			transition('0 => 1', animate('200ms'))
		])
	]
})
export class TopicGroupsComponent implements OnInit, OnDestroy {
	
	public topicId: string;
	
	public faPlay = faPlay;
	
	public proposal;
	public group;
	
	public detailStatus: boolean = false;
	public descStatus: boolean = true;
	
	public nextDetails;
	public isNodeSelected: boolean = false;
	
	public meColor = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457' };
	public proposalColor = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A' };
	public groupColor = { 'background': '#3F51B5', 'border': '#3F51B5', 'hover': '#7986CB', 'highlight': '#283593' };
	
	public visNetwork: string = 'groupvis';
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
		this.visNetworkService.off(this.visNetwork, 'click');
	}
	
	/**
	 * @desc: Called when network is successfully initialized
	 */
	private networkInitialized(): void {
		this.addGraphEvents();	
	}
	
	/**
	 * @desc: Initially draw graph
	 */
	private drawGraph(res): void {
		// Get options
      const options = this.getGraphOptions();
      
      // Get labels, finally extend data and finally draw graph
		forkJoin(
			this.translateService.get("GROUPVIS_PROPOSAL_LABEL"),
			this.translateService.get("GROUPVIS_GROUP_LABEL"))
		.subscribe(([labelProposal, labelGroup]) => {
			// Extend data
			const nodes = _.map(res.nodes, (node, idx) => {
				if(node.level == -1) {
					return _.extend(node, {
						'label': labelProposal+' '+(idx+1),
						'color': node.me ? this.meColor : this.proposalColor
					});
				} else {
					return _.extend(node, {
						'label': labelGroup+' '+node.name,
						'color': node.me ? this.meColor : this.groupColor
					});
				}
			});
      	
      	// Create nodes and edges instances from objects
      	this.nodes = new DataSet<Node>(nodes);
			this.edges = new DataSet<Edge>(res.edges);
			
			// Define data of network graph
			this.visNetworkData = { 'nodes': this.nodes, 'edges': this.edges };
			
			// Define options for network graph
			this.visNetworkOptions = options;
		});
	}
	
	/**
	 * @desc: Adds events to graph
	 */
	private addGraphEvents(): void {
		// Register events
		this.visNetworkService.on(this.visNetwork, 'hoverNode');
		this.visNetworkService.on(this.visNetwork, 'blurNode');
		this.visNetworkService.on(this.visNetwork, 'click');
		
		// Set cursor to pointer on hovering a node
		this.visNetworkService.hoverNode.subscribe((eventData: any[]) => {
			// If event does not come from groupvis graph, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			eventData[1].event.target.style.cursor = 'pointer';
		});
		
		// Reset cursor to default on bluring a node
		this.visNetworkService.blurNode.subscribe((eventData: any[]) => {
			// If event does not come from groupvis graph, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			eventData[1].event.target.style.cursor = 'default';
		});
		
		this.visNetworkService.click.subscribe((eventData: any[]) => {
			// If event does not come from groupvis graph, stop here
			if (eventData[0] != this.visNetwork)
				return;
			
			// If background was clicked
			if (eventData[1].nodes.length == 0) {
				// Clear nextDetails and isNodeSelected
				this.nextDetails = undefined;
				this.isNodeSelected = false;
				// Animate box out
				this.detailStatus = false;
			}
			
			// If node was clicked
			if (eventData[1].nodes.length > 0) {
				// Get node
				const id = eventData[1].nodes[0];
				const node = this.nodes.get(id);
				
				// Store next node to show
				this.nextDetails = node;
				
				// If no node is currently selected, fade description out, details will be shown afterwards
				if (!this.isNodeSelected) {
					// Animate description out
					this.descStatus = false;
				}
				
				// If a node is currenly active, fade details out, new details will be shown afterwards
				if (this.isNodeSelected) {
					// Animate details out
					this.detailStatus = false;
				}
			}
		});
	}
	
	/**
	 * @desc: Is called when the description animation has finished
	 */
	private descAnimationDone(e) {
		// If default faded in
		if (e.toState) {}
		
		// If default faded out
		if (!e.toState) {
			// If detail information shall be shown and no node was selected before, load and show that following node
			if (this.nextDetails && !this.isNodeSelected) {
				this.loadAndFadeInDetails(this.nextDetails);
			}
		}
	}
	
	/**
	 * @desc: Is called when the detail animation has finished
	 */
	private detailAnimationDone(e) {
		// If details faded in
		if (e.toState) {
			// Hide default text
			//this.descStatus = false;
			this.isNodeSelected = true;
			
			// If detail information shall be shown in the next step, hide description
			if (this.nextDetails) {
				// Animate description out
				this.descStatus = false;
			}
		}
		
		// If details faded out
		if (!e.toState) {
			// Reset proposal and group information
			this.proposal = undefined;
			this.group = undefined;
			
			// If no next detail information is intendent to be shown, just show description again
			if (!this.nextDetails) {
				this.descStatus = true;
			}
			
			// If detail information shall be shown and a node was selected before, load and show that following node
			if (this.nextDetails && this.isNodeSelected) {
				this.loadAndFadeInDetails(this.nextDetails);
			}
		}
	}
	
	/**
	 * @desc: Loads and fades in detail information about group or proposal
	 */
	private loadAndFadeInDetails(node) {
		let httpObservable;
		if(node.level == -1) {
			// We have a proposal
			httpObservable = this.httpManagerService.get('/json/groupvis/proposal/'+node.id).subscribe((proposal) => {
				// Show chosen proposal details
				this.proposal = proposal;
				// Animate details in
				this.detailStatus = true;
			});
		} else {
			// We have a group
			httpObservable = this.httpManagerService.get('/json/groupvis/group/'+node.id).subscribe((group) => {
				// Show chosen group details
				this.group = group;
				// Animate details in
				this.detailStatus = true;
			});
		}
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
