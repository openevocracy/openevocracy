// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
var utils = require('../utils');

/*
 * @desc: get group relations for a specific group as array
 */
function getGroupRelationsAsync(groupId) {
	return db.collection('group_relations').find({'groupId': groupId}, {'userId': true, 'prevPadId': true}).toArrayAsync();
}

/*
 * @desc: prepares nodes and edges for topic hierarchy visualiaisation graph
 */
exports.query = function(req, res) {
	var topicId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	// Get proposal padId's and (virtual) level's
	var proposal_promise = db.collection('pads_proposal').find({'topicId': topicId}, {'ownerId': true}).toArrayAsync()
		.map(function(pad) {
			// me is true if both are equal, false otherwise
			var me = utils.equalId(pad.ownerId, userId);
			return { 'id': pad._id, 'level': -1, 'me': me };
	});
	
	// Get groupPads
	var groupPads_promise = db.collection('pads_group').find({'topicId': topicId}, {'groupId': true}).toArrayAsync();
	
	// Get group padId's and level's
	var group_promise = groupPads_promise.map(function(groupPad) {
		// Add level to group pad
		return db.collection('groups').findOneAsync({'_id': groupPad.groupId}, {'level': true})
			.then(function(group) {
				// Flag groups where is user is/was part of
				return getGroupRelationsAsync(group._id).then(function(rels) {
					// Get ownerIds as array
					var members = _.pluck(rels, 'userId');
					// me is true if user is in that group, false otherwise
					var me = utils.containsObjectId(members, userId);
					return { 'id': groupPad._id, 'level': group.level, 'me': me };
				});
			});
	});
	
	// Merge proposals and groups to nodes
	var nodes_promise = Promise.join(proposal_promise, group_promise).spread(function(proposals, groups) {
		return proposals.concat(groups);
	});
	
	// Get edges
	var edges_promise = groupPads_promise.map(function(groupPad) {
		var sink = groupPad._id;
		return getGroupRelationsAsync(groupPad.groupId).map(function(rel) {
			return { 'from': rel.prevPadId, 'to': sink };
		});
	}).then(function(edges) {
		// Since we have two dimensional map, we need to flatten
		return _.flatten(edges);
	});
	
	// Join nodes and edges as result
	Promise.join(nodes_promise, edges_promise).spread(function(nodes, edges) {
		return {
			'nodes': nodes,
			'edges': edges
		};
	}).then(res.json.bind(res));
};
