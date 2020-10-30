const _ = require('underscore');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const db = require('./database').db;
const utils = require('./utils');
const i18next = require('i18next');
const strformat = require('strformat');
const groups = require('./routes/groups');

const C = require('../shared/constants').C;
const cfg = require('../shared/config').cfg;

// Mail transporter
let transporter;

// Mail queue
let queue = [];

// Language sources
const en = require('./i18n/en.json');
const de = require('./i18n/de.json');

function getTimeString(time) {
	const stringHours = 'h';
	const stringDays = 'd';
	if(time <= C.DAY)
		return (Math.round(time/C.HOUR)).toString() + ' ' + stringHours;
	else
		return (Math.round(time/C.DAY)).toString() + ' ' + stringDays;
}

/**
 * @desc: Initialize translation, smpt connection and transporter
 */
exports.initialize = function() {
	// Initialize i18n
	i18next.init({
		fallbackLng: 'en',
		resources: {
			en: { translation: en },
			de: { translation: de }
		}
	}, function(err, t) {
		// If any error happens, log it
		if(err) console.log(err);
	});
	
	// Get smtp credentials from config and create transporter
	const smtpConfig = {
		'host': cfg.PRIVATE.MAIL_HOST,
		'port': cfg.PRIVATE.MAIL_PORT,
		'secure': cfg.PRIVATE.MAIL_SECURE,
		//'logger': true,
		//'debug': true,
		tls: {
			'rejectUnauthorized': false // allow self signed certificate
		},
		auth: {
			'user': cfg.PRIVATE.MAIL_USER,
			'pass': cfg.PRIVATE.MAIL_PASS
		}
	};
	
	transporter = nodemailer.createTransport(smtpConfig);
};

/**
 * @desc: Hash mail using an identifier (e.g. translation key of subject) and email of user
 */
function mailHash(mailType, mailIdentifier, mailUser) {
    return crypto.createHash('sha256').
        update(mailType).update(mailIdentifier.toString()).update(mailUser.toString()).digest('hex');
}

/**
 * @desc: If parameters exist, translate and fill params; if not, just translate
 */
function formatAndTranslate(key, params) {
	if(params.length > 0)
		return strformat.call(this, i18next.t(key), ...params);
	else
		return i18next.t(key);
}

/**
 * @desc: Add an email with an address, a subject and a text to queue
 */
function addMailToQueue(toEmailAddress, subject, text) {
	// Define mail options with sender, receriver, subject and body
	var mailOptions = {
		'from': '"Evocracy Project" <'+cfg.PRIVATE.MAIL_ADDRESS+'>',
		'to': toEmailAddress,
		'subject': subject,
		//'text': text  // plaintext body
		'html': text  // html body
	};
	
	// Add mail options to queue
	queue.push(mailOptions);
}
exports.addMailToQueue = addMailToQueue;

/**
 * @desc: Sends first email from queue, if exists
 */
exports.sendMailFromQueue = function() {
	// Get and remove first entry in queue and send mail
	const mailOptions = queue.shift();
	
	// If no email is in queue, do nothing
	if(_.isUndefined(mailOptions))
		return;
	
	// Send mail via nodemailer if MAIL flag is true in config
	if(cfg.MAIL_ENABLED) {
		transporter.sendMail(mailOptions, function(error, info) {
			if (error)
				return console.log('Message not sent: ' + error);
			console.log('Message sent: ' + info.response);
		});
	} else {
		console.log('Message was NOT sent: Configurations flag MAIL was set to false');
	}
};

/**
 * @desc: Takes user information, raw subject and raw text, including parameters, and sends mail
 * @params:
 *   mailUser:          user object, needs to containt 'email' and 'lang' of user
 *   mailSubject:       translation key for subject
 *   mailSubjectParams: array, contains all variables which need to be filled into subject
 *   mailBody:          translation key for body
 *   mailBodyParams:    array, contains all variables which need to be filled into body
 */
function sendMailToUser(mailUser, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// First change language of i18n
	i18next.changeLanguage(mailUser.lang, function(err, t) {
		// If any error occurs while language change, log it
		if(err) console.log(err);
		
		// Avoid that string is seperated in characters
		var emailAdress = (_.isString(mailUser.email) ? [mailUser.email] : mailUser.email);
		
		// Send mail
		addMailToQueue(emailAdress, formatAndTranslate(mailSubject, mailSubjectParams), formatAndTranslate(mailBody, mailBodyParams));
	});
}
exports.sendMailToUser = sendMailToUser;

/**
 * @desc: Takes user information from user id and calls sendMailToUser()
 * @params:
 *   mailId: id of user
 *   other params same as sendMailToUser() function
 */
function sendMailToUserId(userId, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// Get user from database
	const user_promise = db.collection('users').findOneAsync({ '_id': userId }, { 'email': true, 'lang': true });
	
	// After user is found, send mail
	user_promise.then(function(user) {
		sendMailToUser(user, mailSubject, mailSubjectParams, mailBody, mailBodyParams);
	});
}
exports.sendMailToUserId = sendMailToUserId;

/**
 * @desc: Takes user information from array of user ids and call sendMailToUser() for every user
 * @params:
 *   mailIds: several user ids
 *   other params same as sendMailToUser() function
 */
function sendMailToUserIds(userIds, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// Get users from database
	const user_promise = db.collection('users').find({ '_id': { '$in': userIds } }, { 'email': true, 'lang': true }).toArrayAsync();
	
	// After user is found, send mail
	user_promise.then(function(users) {
		sendMailMulti(users, mailSubject, mailSubjectParams, mailBody, mailBodyParams);
	});
}
exports.sendMailToUserIds = sendMailToUserIds;

/**
 * @desc: send email to multiple users (find details in description of 'sendMail' function)
 * @params:
 *   mailUsers: an array with mailUser elements (see 'sendMailToUser()' function)
 *   other params same as sendMailToUser() function
 */
function sendMailMulti(mailUsers, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	_.each(mailUsers, function(mailUser) {
		sendMailToUser(mailUser, mailSubject, mailSubjectParams, mailBody, mailBodyParams);
	});
}
exports.sendMailMulti = sendMailMulti;

/**
 * @desc: Send email only once and avoid multiple times sending the same mail (more details in 'sendMail' func)
 */
function sendMailOnce(mailUser, mailSubject, mailSubjectParams, mailBody, mailBodyParams, hash, interval) {
	// Use interval to allow resending a specific mail after some time
	return db.collection('mail').findOneAsync({$query:{ 'hash': hash }, $orderby:{ '_id': -1 }}).then(function(hashFromDb) {
		// If mail was already sent OR sending of mail is NOT longer ago than interval
		if((hashFromDb && _.isUndefined(interval)) || 
			(hashFromDb && !_.isUndefined(interval) &&
			hashFromDb._id.getTimestamp().getTime() > Date.now() - interval)) {
			return Promise.resolve();
		}
		// If mail was not yet send OR sending of mail is longer ago than interval
		sendMailToUser(mailUser, mailSubject, mailSubjectParams, mailBody, mailBodyParams);
		return db.collection('mail').insertOneAsync({ 'hash': hash });
	});
}
exports.sendMailOnce = sendMailOnce;

/**
 * @desc: Remind participants that the deadline of proposal stage is coming
 */
function sendEmailToAllTopicParticipants(mailType, topic, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	
	return db.collection('pads_proposal').find({'topicId': topic._id}, {'authorId': true, 'expiration': true})
		.toArrayAsync().map(function(proposal) {
			// Find user information for every proposal author
			return db.collection('users')
				.findOneAsync({ '_id': proposal.authorId }, {'email': true, 'lang': true})
				.then((user) => {
					// Get timestamp, when proposal was created
					const created = proposal._id.getTimestamp();
					// Get shift according to reminder type (first or second)
					const shift = (mailSubject == 'EMAIL_REMINDER_PROPOSAL_FIRST') ? cfg.REMINDER_PROPOSAL_FIRST : cfg.REMINDER_PROPOSAL_SECOND;
					// Only send mail if document created before the reminder time
					if (created < proposal.expiration-shift) {
						sendMailOnce(user,
							mailSubject, mailSubjectParams, mailBody, mailBodyParams,
							mailHash(mailType, topic._id, user._id));
					}
					return Promise.resolve();
				});
	});
	
	// Delete after 31.05.2020
	/*// In proposal stage, all sources in proposal tables are users
	return db.collection('pads_proposal').find({'topicId': topic._id}, {'authorId': true})
		.toArrayAsync().then(function(participants) {
			return db.collection('users')
				.find({ '_id': { $in: _.pluck(participants, 'authorId') } }, {'email': true, 'lang': true})
				.toArrayAsync();
		}).map(function(user) {
			sendMailOnce(user,
				mailSubject, mailSubjectParams, mailBody, mailBodyParams,
				mailHash(mailType, topic._id, user._id));
			return Promise.resolve();
		});*/
}
exports.sendEmailToAllTopicParticipants = sendEmailToAllTopicParticipants;

/**
 * @desc: Send email to all members of *several* groups
 */
function sendEmailToMembersOfSpecificGroups(mailType, gids, tid, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// Send email to members of specific groups
	// "gids" is an array of group id's where a mail should be sent to
	
	// If gids is just a single gid, transform it to an array
	if(!_.isArray(gids))
		gids = [gids];
	
	// Send mail to group members of groups with gid in gids
	return db.collection('group_relations')
			.find({ 'gid': { $in: gids }
		}).toArrayAsync().then(function(members) {
			return db.collection('users')
				.find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true, 'lang': true})
				.toArrayAsync();
		}).map(function(user) {
			sendMailOnce(user,
				mailSubject, mailSubjectParams, mailBody, mailBodyParams,
				mailHash(mailType, tid, user._id));
			return Promise.resolve();
		});
}

/**
 * @desc: Send email to all members of a group
 */
function sendEmailToAllActiveGroupMembers(mailType, topic, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// Remind members that the deadline of the level (group) is coming
	return groups.helper.getGroupsOfSpecificLevelAsync(topic._id, topic.level).then(function(groups) {
		sendEmailToMembersOfSpecificGroups(
			mailType, _.pluck(groups, '_id'), topic._id,
			mailSubject, mailSubjectParams, mailBody, mailBodyParams);
		return Promise.resolve();
	});
}
exports.sendEmailToAllActiveGroupMembers = sendEmailToAllActiveGroupMembers;

/**
 * @desc: Send email to all members of a group which were not active for a longer time
 */
function sendEmailToAllLazyGroupMembers(mailType, topic, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// If lazy reminder is disabled then exit early
	if(cfg.REMINDER_GROUP_LAZY < 0)
		return Promise.resolve();
	
	// Remind members who where not active in that group for a specific time
	return db.collection('groups').find({ 'tid': topic._id, 'level': topic.level })
		.toArrayAsync().then(function(groups) {
		return db.collection('group_relations')
			.find({ 'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
		}).filter(function(member) {
			// Only notify group members with timestamps older than REMINDER_GROUP_LAZY
			// OR -1 (user never opend group)
			var lastActivity = member.lastActivity == -1 ? member._id.getTimestamp().getTime() : member.lastActivity;
			return Date.now() >= lastActivity + cfg.REMINDER_GROUP_LAZY;
		}).then(function(members) {
			// Get the users
			return db.collection('users')
				.find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true, 'lang': true})
				.toArrayAsync().map(function(user) {
					var member = utils.findWhereObjectId(members, {'uid': user._id});
					sendMailOnce(user,
						mailSubject, mailSubjectParams, mailBody, mailBodyParams,
						mailHash(mailType, member._id, user._id), cfg.REMINDER_GROUP_LAZY);
					return Promise.resolve();
				});
		});
}
exports.sendEmailToAllLazyGroupMembers = sendEmailToAllLazyGroupMembers;

/**
 * @desc: Send email to all members of a group which have not rated other members so far
 */
function sendEmailRatingReminderToGroupMembers(mailType, topic, mailSubject, mailSubjectParams, mailBody, mailBodyParams) {
	// If rating reminder is disabled then exit early
	if(cfg.REMINDER_GROUP_RATING < 0)
		return Promise.resolve();
	
	// Find groups which are currently active
	return groups.helper.getGroupsOfSpecificLevelAsync(topic._id, topic.level).filter(function(group) {
		// Find out if leader can be figured out for every group
		return groups.ratings.getGroupLeaderAsync(group._id).then(_.isUndefined);
	}).then(function(leaderless_groups) {
		console.log('no rating in:', leaderless_groups);
		// send mail to all group members
		sendEmailToMembersOfSpecificGroups(
			mailType, _.pluck(leaderless_groups, '_id'),
			topic._id, mailSubject, mailSubjectParams, mailBody, mailBodyParams);
		return Promise.resolve();
	});
}
exports.sendEmailRatingReminderToGroupMembers = sendEmailRatingReminderToGroupMembers;

/**
 * @desc: Deadline reminders in every stage
 */
exports.sendTopicReminderMessages = function(topic) {
	switch (topic.stage) {
		case C.STAGE_PROPOSAL: // we are currently in proposal stage
		
			if (!topic.isReminderProposalFirst && Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_FIRST) {
				sendEmailToAllTopicParticipants('EMAIL_REMINDER_PROPOSAL_FIRST', topic,
					'EMAIL_REMINDER_PROPOSAL_FIRST_SUBJECT', [topic.name],
					'EMAIL_REMINDER_PROPOSAL_FIRST_MESSAGE', [topic.name, getTimeString(cfg.REMINDER_PROPOSAL_FIRST)])
				.then(() => {
					db.collection('topics').update({'_id': topic._id}, { $set: {'isReminderProposalFirst': true} });
				});
			}
			if (topic.isReminderProposalFirst && !topic.isReminderProposalSecond && Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_SECOND) {
				sendEmailToAllTopicParticipants('EMAIL_REMINDER_PROPOSAL_SECOND', topic,
					'EMAIL_REMINDER_PROPOSAL_SECOND_SUBJECT', [topic.name],
					'EMAIL_REMINDER_PROPOSAL_SECOND_MESSAGE', [topic.name, getTimeString(cfg.REMINDER_PROPOSAL_SECOND)])
				.then(() => {
					db.collection('topics').update({'_id': topic._id}, { $set: {'isReminderProposalSecond': true } });
				});
			}
			break;
		case C.STAGE_CONSENSUS: // we are currently in consensus stage
		
			// Lazy group members, if members where inactive for some time
			sendEmailToAllLazyGroupMembers('EMAIL_ALL_LAZY_GROUP_MEMBERS', topic,
				'EMAIL_ALL_LAZY_GROUP_MEMBERS_SUBJECT', [topic.name],
				'EMAIL_ALL_LAZY_GROUP_MEMBERS_MESSAGE', [topic.name, getTimeString(cfg.REMINDER_GROUP_LAZY)]);
			
			// Group rating reminder, if no ratings where made in that group
			if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_RATING) {
				sendEmailRatingReminderToGroupMembers('EMAIL_RATING_REMINDER_GROUP_MEMBERS', topic,
					'EMAIL_RATING_REMINDER_GROUP_MEMBERS_SUBJECT', [topic.name],
					'EMAIL_RATING_REMINDER_GROUP_MEMBERS_MESSAGE', [topic.name]);
			}
			
			// Group reminder
			if(!topic.isReminderGroupFirst && Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_FIRST) {
				sendEmailToAllActiveGroupMembers('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND', topic,
					'EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_SUBJECT', [topic.name],
					'EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_MESSAGE', [topic.name, getTimeString(cfg.REMINDER_GROUP_FIRST)])
				.then(() => {
					db.collection('topics').update({'_id': topic._id}, { $set: {'isReminderGroupFirst': true} });
				});
			}
			if(topic.isReminderGroupFirst && !topic.isReminderGroupSecond && Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_SECOND) {
				sendEmailToAllActiveGroupMembers('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST', topic,
					'EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_SUBJECT', [topic.name],
					'EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_MESSAGE', [topic.name, getTimeString(cfg.REMINDER_GROUP_SECOND)])
				.then(() => {
					db.collection('topics').update({'_id': topic._id}, { $set: {'isReminderGroupSecond': true} });
				});
			}
			break;
	}
		
		return Promise.resolve();
};
