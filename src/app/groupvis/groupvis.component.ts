import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { HttpManagerService } from '../_services/http-manager.service';

import { Network } from 'vis';
import * as _ from 'underscore';

import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'groupvis',
	templateUrl: './groupvis.component.html',
	styleUrls: ['./groupvis.component.scss']
})
export class GroupvisComponent implements OnInit {
	@Input() topicId: string;
	@Output() close = new EventEmitter();
	
	private faTimes = faTimes;
	
	private meColor = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457'};
	private proposalColor = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A'};
	private groupColor = { 'background': '#3F51B5', 'border': '#3F51B5', 'hover': '#7986CB', 'highlight': '#283593' };
	
	constructor(
		private httpManagerService: HttpManagerService,
		private translateService: TranslateService) { }
	
	ngOnInit() {
		// Get nodes and edges from server and call function to draw graph
		this.httpManagerService.get('/json/groupvis/'+this.topicId).subscribe(this.drawGraph.bind(this));
	}
	
	private closeGraph() {
		console.log('close');
		this.close.emit(null);
	}
	
	/*private initGraph(topicId) {
		// Get nodes and edges from server and call function to draw graph
		this.httpManagerService.get('/json/groupvis/'+topicId).subscribe(this.drawGraph.bind(this));
	}*/
	
	private drawGraph(res) {
		// Define container and options
		let container = document.getElementById('graph');
      let options = this.getGraphOptions();
      let data = this.extendData(res);
      
      // Create network graph
      let network = new Network(container, data, options);
      
      this.initGraphEvents();
	}
	
	private initGraphEvents() {}
	
	private extendData(data) {
		let labelProposal = "Vorschlag";
		let labelGroup = "Gruppe";
		
		// FIXME: How to deal with observables here?
		/*this.translateService.get("GROUPVIS_PROPOSAL_LABEL").subscribe(labelProposal => {
			this.translateService.get("GROUPVIS_PROPOSAL_LABEL").subscribe(labelGroup => {
				this.extendNodes(data, labelProposal, labelGroup)
			});
		});*/
		
		let nodes = _.map(data.nodes, function(node) {
			if(node.level == -1) {
				return _.extend(node, {
					'label': labelProposal+' '+node.id.slice(20,24),
					'color': node.me ? this.meColor : this.proposalColor
				});
			} else {
				return _.extend(node, {
					'label': labelGroup+' '+node.id.slice(20,24),
					'color': node.me ? this.meColor : this.groupColor
				});
			}
		}.bind(this));
		
		return { 'nodes': nodes, 'edges': data.edges };
	}
	
	private extendNodes() {
		
	}
	
	private getGraphOptions() {
		return {
		//'height': (window.innerHeight - 175) + "px",
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
              //'size': 50,
              'heightConstraint': {
                  'minimum': 28
              },
              //'borderWidth': 14,
              'labelHighlightBold': false,
              'font': {
                  'color': '#fff',
                  'face': 'Roboto',
                  //'size': 12,
                  //'vadjust': 0,
                  //'background': '#fff'
                  //'strokeWidth': 7,
                  //'strokeColor': '#fff'
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
