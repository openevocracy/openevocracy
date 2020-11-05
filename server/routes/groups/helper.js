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
 * @desc: Generate member names for all members of a group
 *			 from chance library, using groupId and userId as seed
 * @note: It is important to generate all names together, given all userIds,
 *			 since the names should be unique
 */
exports.generateMemberNames = function(groupId, userIds) {
	let userNames = [];
	
	userIds.forEach((userId) => {
		// Generate unique username, given all already existing userNames
		const userName = generateUniqueName(groupId, userId, userNames)
		// Push user name to user names array
		userNames.push(userName);
	});
	
	return userNames;
};

exports.getOrGenerateMemberName = async function(groupId, userId) {
	// Get all user names from group
	const members = await db.collection('group_relations').find(
		{ 'groupId': groupId }, { 'userId': true, 'userName': true }
	).toArrayAsync();
	
	console.log(members);
	
	const member = utils.findWhereObjectId(members, { 'userId': userId });
	
	console.log(member);
	
	console.log(_.pluck(members, 'userName'));
	
	// Return unique user name
	if (_.isUndefined(member))
		return generateUniqueName(groupId, userId, _.pluck(members, 'userName'));
	else
		return member.userName;
};

function generateUniqueName(groupId, userId, presentUserNames) {
	// Create new chance object, which seed exists out of groupId and userId
	const seed = groupId.toString()+userId.toString();
	const chanceName = new Chance(seed);	
	
	// Sample a user name, until user name is unique in this group
	let userName = chanceName.first();
	while(presentUserNames.includes(userName)) {
		userName = chanceName.first();
	}
	
	return userName;
}

/**
 * @desc: Gets user name for member or members in group from database
 */
exports.getGroupUserNameAsync = function(groupId, userId) {
	return db.collection('group_relations').findOneAsync(
		{ 'groupId': groupId, 'userId': userId }, { 'userName': true }
	).get('userName');
};

/**
 * @desc: Gets all user names for alls members of group from database
 */
exports.getGroupUserNamesAsync = function(groupId) {
	return db.collection('group_relations').find(
		{ 'groupId': groupId }, { 'userName': true }
	).toArrayAsync().map((member) => {
		return member.userName;
	});
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
