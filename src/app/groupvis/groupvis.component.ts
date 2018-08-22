import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { trigger, transition, group, animate, style, state } from '@angular/animations'
import { forkJoin } from 'rxjs/observable/forkJoin';

import { UtilsService } from '../_services/utils.service';
import { HttpManagerService } from '../_services/http-manager.service';

import { Network } from 'vis';
import * as $ from 'jquery';
import * as _ from 'underscore';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'groupvis',
	templateUrl: './groupvis.component.html',
	styleUrls: ['./groupvis.component.scss'],
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

export class GroupvisComponent implements OnInit {
	@Input() topicId: string;
	@Output() close = new EventEmitter();
	
	private nodes;
	private network;
	private detail;
	private detailStatus: string = 'out';
	
	private faTimes = faTimes;
	
	private meColor = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457'};
	private proposalColor = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A'};
	private groupColor = { 'background': '#3F51B5', 'border': '#3F51B5', 'hover': '#7986CB', 'highlight': '#283593' };
	
	constructor(
		private utilsService: UtilsService,
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService) { }
	
	ngOnInit() {
		// Get nodes and edges from server and call function to draw graph
		this.httpManagerService.get('/json/groupvis/'+this.topicId).subscribe(this.drawGraph.bind(this));
		
		// Fit network on resize
		$(window).on('resize', _.debounce(function() {
			this.network.fit();
		}.bind(this), 500));
	}
	
	private closeGraph() {
		this.close.emit(null);
	}
	
	private drawGraph(res) {
		// Define container and options
		let container = document.getElementById('graph');
      let options = this.getGraphOptions();
      
      // Get labels, finally extend data and finally draw graph
		forkJoin(
			this.translateService.get("GROUPVIS_PROPOSAL_LABEL"),
			this.translateService.get("GROUPVIS_GROUP_LABEL"))
		.subscribe(([labelProposal, labelGroup]) => {
			// Extend data
			this.nodes = _.map(res.nodes, function(node) {
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
			let data = { 'nodes': this.nodes, 'edges': res.edges };
      	this.network = new Network(container, data, options);
      	
      	this.addGraphEvents();
		});
	}
	
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
