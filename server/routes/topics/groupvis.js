// General libraries
var _ = require('underscore');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

// Own references
var db = require('../../database').db;
var utils = require('../../utils');
var pads = require('../pads');

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
	const topicId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	// Get proposal padId's and (virtual) level's
	const proposal_promise = db.collection('pads_proposal').find({'topicId': topicId}, {'authorId': true}).toArrayAsync()
		.map(function(pad) {
			// me is true if both are equal, false otherwise
			const me = utils.equalId(pad.authorId, userId);
			return { 'id': pad._id, 'level': -1, 'me': me };
	});
	
	// Get groupPads
	const groupPads_promise = db.collection('pads_group').find({'topicId': topicId}, {'groupId': true}).toArrayAsync();
	
	// Get group padId's and level's
	const group_promise = groupPads_promise.map(function(groupPad) {
		// Add level to group pad
		return db.collection('groups').findOneAsync({'_id': groupPad.groupId}, { 'level': true, 'name': true })
			.then(function(group) {
				// Flag groups where is user is/was part of
				return getGroupRelationsAsync(group._id).then(function(rels) {
					// Get authorIds as array
					const members = _.pluck(rels, 'userId');
					// me is true if user is in that group, false otherwise
					const me = utils.containsObjectId(members, userId);
					return { 'id': groupPad._id, 'level': group.level, 'name': group.name, 'me': me };
				});
			});
	});
	
	// Merge proposals and groups to nodes
	const nodes_promise = Promise.join(proposal_promise, group_promise).spread(function(proposals, groups) {
		return proposals.concat(groups);
	});
	
	// Get edges
	const edges_promise = groupPads_promise.map(function(groupPad) {
		const sink = groupPad._id;
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

/*
 * @desc: Get details about specific proposal when user clicked on it in graph
 */
exports.getProposal = function(req, res) {
	var padId = ObjectId(req.params.id);
	
	db.collection('pads_proposal')
		.findOneAsync({'_id': padId}, { 'docId': true, 'expiration': true, 'authorId': true }).then(function(pad) {
			// Get html with docId
			return pads.getPadHTMLAsync('proposal', pad.docId).then(function(html) {
				// Return number of words and expiration timestamp
				return { 'padId': pad._id, 'html': html, 'numWords': utils.countHtmlWords(html), 'expiration': pad.expiration, 'authorId': pad.authorId };
			});
	}).then(res.json.bind(res));
};

/*
 * @desc: Get details about specific group when user clicked on it in graph
 */
exports.getGroup = function(req, res) {
	var padId = ObjectId(req.params.id);
	
	db.collection('pads_group').findOneAsync({'_id': padId}, {'docId': true, 'groupId': true, 'expiration': true}).then(function(pad) {
		// Get number of words in group pad
		const numWords_promise = pads.getPadHTMLAsync('group', pad.docId).then(utils.countHtmlWords);
		
		// Get amount of members in group
		const numMembers_promise = db.collection('group_relations').countAsync({'groupId': pad.groupId});
		
		// Get name of group
		const group_promise = db.collection('groups').findOneAsync({ '_id': pad.groupId }, { 'name': true });
		
		// Join all information and send response
		return Promise.join(numWords_promise, numMembers_promise, group_promise)
			.spread(function(numWords, numMembers, group) {
				return {
					'groupId': pad.groupId,
					'numWords': numWords,
					'numMembers': numMembers,
					'expiration': pad.expiration,
					'name': group.name
				};
		});
	}).then(res.json.bind(res));
};
