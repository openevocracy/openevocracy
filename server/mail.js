var _ = require('underscore');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var strformat = require('strformat');

var db = require('./database').db;
var utils = require('./utils');
var i18n = require('./i18n');
var ratings = require('./routes/ratings');
var groups = require('./routes/groups');

var C = require('../shared/constants');
var cfg = require('../shared/config').cfg;

var transporter;

function getTimeString(time) {
    var stringHours = i18n.t('hours');
    var stringDays = i18n.t('days');
    if(time <= C.DAY)
        return (Math.round(time/C.HOUR)).toString() + ' ' + stringHours;
    else
        return (Math.round(time/C.DAY)).toString() + ' ' + stringDays;
}

exports.initializeMail = function() {
    db.collection('configs').findOneAsync({'type': 'mailauth'},{'user': true, 'password': true})
        .then(function(credentials) {
           var smtpConfig = {
                'host': 'smtp.openevocracy.org',
                'port': 587, //2587,
                'secure': false,
                //'logger': true,
                //'debug': true,
                tls: {
                    'rejectUnauthorized': false // allow self signed certificate
                },
                auth: {
                    'user': credentials.user,
                    'pass': credentials.password
                }
            };
            
            Promise.props(smtpConfig).then(function(smtpConfig) {
                transporter = nodemailer.createTransport(smtpConfig);
            }); 
        });
};

function mailHash(mailType, mailIdentifier, mailUser) {
    return crypto.createHash('sha256').
        update(mailType).update(mailIdentifier.toString()).update(mailUser.toString()).digest('hex');
}

function sendMail(mailTo, mailSubject, mailText) {
    var mailOptions = {
        'from': '"Evocracy Project" <noreply@openevocracy.org>', // sender address
        //'to': mailTo, // list of receivers
        'subject': mailSubject, // Subject line
        'text': mailText//, // plaintext body
        //html: '<b>Welcome/b>' // html body
    };
    
    // Avoid that string is seperated in characters
    if(_.isString(mailTo))
        mailTo = [mailTo];
    
    if(cfg.MAIL) {
        _.each(mailTo, function(receiver) {
            transporter.sendMail(_.extend(mailOptions, {'to': receiver}), function(error, info) {
                if (error)
                    return console.log(error);
                console.log('Message sent: ' + info.response);
            });
        });
    } else {
        console.log('Message was NOT sent: Configurations flag MAIL was set to false');
    }
}
exports.sendMail = sendMail;

function sendMailOnce(mailTo, mailSubject, mailText, hash, interval) {
    // Use interval to allow resending a specific mail after some time
    return db.collection('mail').findOneAsync({$query:{ 'hash': hash }, $orderby:{ '_id': -1 }}).then(function(hashFromDb) {
        // If mail was already sent OR
        // sending of mail is NOT longer ago than interval
        if((hashFromDb && _.isUndefined(interval)) || 
           (hashFromDb && !_.isUndefined(interval) &&
            hashFromDb._id.getTimestamp().getTime() > Date.now() - interval)) {
            return Promise.resolve();
        }
        
        // If mail was not yet send OR
        // sending of mail is longer ago than interval
        sendMail(mailTo, mailSubject, mailText);
        return db.collection('mail').insertOneAsync({ 'hash': hash });
    });
}
exports.sendMailOnce = sendMailOnce;

function sendEmailToAllTopicParticipants(mailType, topic, mailSubject, mailText) {
    // Remind participants that the deadline of proposal stage is coming
    // In proposal stage, all sources in proposals table are users
    return db.collection('proposals').find({'tid': topic._id}, {'source': true}).
        toArrayAsync().then(function(participants) {
            return db.collection('users').
                find({ '_id': { $in: _.pluck(participants, 'source') } }, {'email': true}).
                toArrayAsync();
        }).map(function(user) {
            sendMailOnce(user.email, mailSubject, mailText, mailHash(mailType, topic._id, user._id));
            return Promise.resolve();
        });
}
exports.sendEmailToAllTopicParticipants = sendEmailToAllTopicParticipants;

function sendEmailToMembersOfSpecificGroups(mailType, gids, tid, mailSubject, mailText) {
    // Send email to members of specific groups
    // "gids" is an array of group id's where a mail should be sent to
    
    // If gids is just a single gid, transform it to an array
    if(!_.isArray(gids))
        gids = [gids];
    
    // Send mail to group members of groups with gid in gids
    return db.collection('group_members').
        find({ 'gid': { $in: gids }
    }).toArrayAsync().then(function(members) {
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMailOnce(user.email, mailSubject, mailText, mailHash(mailType, tid, user._id));
        return Promise.resolve();
    });
}

function sendEmailToAllActiveGroupMembers(mailType, topic, mailSubject, mailText) {
    // Remind members that the deadline of the level (group) is coming
    return groups.getGroupsOfSpecificLevelAsync(topic._id, topic.level).then(function(groups) {
        sendEmailToMembersOfSpecificGroups(mailType, _.pluck(groups, '_id'), topic._id, mailSubject, mailText);
        return Promise.resolve();
    });
}
exports.sendEmailToAllActiveGroupMembers = sendEmailToAllActiveGroupMembers;

function sendEmailToAllLazyGroupMembers(mailType, topic, mailSubject, mailText) {
    // If lazy reminder is disabled then exit early
    if(cfg.REMINDER_GROUP_LAZY < 0)
        return Promise.resolve();
    
    // Remind members who where not active in that group for a specific time
    return db.collection('groups').find({ 'tid': topic._id, 'level': topic.level }).
    toArrayAsync().then(function(groups) {
        return db.collection('group_members').
            find({ 'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
    }).filter(function(member) {
        // Only notify group members with timestamps older than REMINDER_GROUP_LAZY
        // or -1 (user never opend group)
        var lastActivity = member.lastActivity == -1 ? member._id.getTimestamp().getTime() : member.lastActivity;
        return Date.now() >= lastActivity + cfg.REMINDER_GROUP_LAZY;
    }).then(function(members) {
        // get the users
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync().map(function(user) {
                var member = utils.findWhereObjectId(members, {'uid': user._id});
                sendMailOnce(user.email, mailSubject, mailText, mailHash(mailType, member._id, user._id), cfg.REMINDER_GROUP_LAZY);
                return Promise.resolve();
            });
    });
}
exports.sendEmailToAllLazyGroupMembers = sendEmailToAllLazyGroupMembers;

function sendEmailRatingReminderToGroupMembers(mailType, topic, mailSubject, mailText) {
    // If rating reminder is disabled then exit early
    if(cfg.REMINDER_GROUP_RATING < 0)
        return Promise.resolve();
    
    // Find groups which are currently active
    return groups.getGroupsOfSpecificLevelAsync(topic._id, topic.level).filter(function(group) {
        // Find out if leader can be figured out for every group
        return ratings.getGroupLeaderAsync(group._id).then(_.isUndefined);
    }).then(function(leaderless_groups) {
        console.log('no rating in:', leaderless_groups);
        // send mail to all group members
        sendEmailToMembersOfSpecificGroups(mailType, _.pluck(leaderless_groups, '_id'), topic._id, mailSubject, mailText);
        return Promise.resolve();
    });
}
exports.sendEmailRatingReminderToGroupMembers = sendEmailRatingReminderToGroupMembers;

exports.sendTopicReminderMessages = function(topic) {
    switch (topic.stage) {
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
        
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_SECOND) {
                return sendEmailToAllTopicParticipants('EMAIL_REMINDER_PROPOSAL_SECOND',
                    topic,strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_SECOND_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_SECOND_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_PROPOSAL_SECOND))
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_FIRST) {
                return sendEmailToAllTopicParticipants('EMAIL_REMINDER_PROPOSAL_FIRST',
                    topic,strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_FIRST_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_FIRST_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_PROPOSAL_FIRST))
                );
            }
            break;
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
        
            // Lazy group members, if members where inactive for some time
            i18n.initAsync.then(function() {
                sendEmailToAllLazyGroupMembers('EMAIL_ALL_LAZY_GROUP_MEMBERS',
                    topic,strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_GROUP_LAZY))
                );
            });
            
            // Group rating reminder, if no ratings where made in that group
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_RATING) {
                return sendEmailRatingReminderToGroupMembers('EMAIL_RATING_REMINDER_GROUP_MEMBERS',
                    topic,strformat(i18n.t('EMAIL_RATING_REMINDER_GROUP_MEMBERS_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_RATING_REMINDER_GROUP_MEMBERS_MESSAGE'), topic.name)
                );
            }
            
            // Group reminder
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_SECOND) {
                return sendEmailToAllActiveGroupMembers('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST',
                    topic,strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_GROUP_SECOND))
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_FIRST) {
                return sendEmailToAllActiveGroupMembers('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND',
                    topic,strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_GROUP_FIRST))
                );
            }
            break;
    }
    
    return Promise.resolve();
};
