// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const Chance = require('chance');
const Color = require('color');

// Own references
const cfg = require('../../../shared/config').cfg;
const db = require('../../database').db;
const utils = require('../../utils');
const pads = require('../pads');

/**
 * @desc: Get group relations for specific group from database
 */
exports.getGroupMembersAsync = function(groupId) {
	return db.collection('group_relations').find({'groupId': groupId}).toArrayAsync();
};

/*
 * @desc: Generate username from chance library, using groupId and userId as seed
 */
exports.generateMemberName = function(groupId, userId) {
	// Create new chance object, which seed exists out of groupId and userId
   const seed = groupId.toString()+userId.toString();
   const chanceName = new Chance(seed);
   
   // Generate name and return
   return chanceName.first();
};

/**
 * @desc: Generate color for all members of a group
 * @note: It is important to generate all colors together, given all userIds,
 * 		 since the colors are chosen in a way that they have maximal distance in color space
 */
exports.generateMemberColors = function(groupId, userIds) {
	// Generate group specific color_offset
	const chance = new Chance(groupId.toString());
	const colorOffset = chance.integer({min: 0, max: 360});
	
	// Get number of members in group
	const numMembers = _.size(userIds);
	
	// Calculate color for every member and return as array
	return _.map(userIds, (userId, index) => {
		const hue = colorOffset + index*(360/numMembers);
		return Color({h: hue, s: 20, v: 100}).hex();
	});
};

/**
 * @desc: Check if specific proposal is valid, return true or false
 * @param:
 *     html: text of the proposal as html
 */
function isProposalValid(html) {
	// Valid if number of words in html is greater than configured threshold
	return utils.countHtmlWords(html) >= cfg.MIN_WORDS_PROPOSAL;
}
exports.isProposalValid = isProposalValid;

/**
 * @desc: Get groups of a specific level in a specific topic
 */
function getGroupsOfSpecificLevelAsync(topicId, level) {
    return db.collection('groups').find({ 'topicId': topicId, 'level': level }).toArrayAsync();
}
exports.getGroupsOfSpecificLevelAsync = getGroupsOfSpecificLevelAsync;

/**
 * @desc: Get VALID groups of a specific level in a specific topic
 */
exports.getValidGroupsOfSpecificLevelAsync = function(topicId, level) {
	return getGroupsOfSpecificLevelAsync(topicId, level).filter(function (group) {
		return db.collection('pads_group').findOneAsync({'groupId': group._id})
			.then(function(proposal) {
				// Get HTML from document
				proposal.body = pads.getPadHTMLAsync('group', proposal.docId);
				return Promise.props(proposal);
			}).then(function(proposal) {
				console.log('html', proposal.body);
				console.log('isValid', isProposalValid(proposal.body));
				// Check if proposal is valid
				return isProposalValid(proposal.body);
			});
	});
};
