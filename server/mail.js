var _ = require('underscore');
var requirejs = require('requirejs');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var strformat = require('strformat');

var db = require('./database').db;
var utils = require('./utils');
var i18n = require('./i18n');

var C = requirejs('public/js/setup/constants');
var cfg = requirejs('public/js/setup/configs');

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
    var smtpConfig = {
        host: 'smtp.openevocracy.org',
        port: 2587,
        secure: false,
        //logger: true,
        //debug: true,
        tls: {
            rejectUnauthorized: false // allow self signed certificate
        },
        
        auth: db.collection('configs').findOneAsync({'type': 'mailauth'},{'user': true, 'pass': true})
    };
    
    Promise.props(smtpConfig).then(function(smtpConfig) {
        transporter = nodemailer.createTransport(smtpConfig);
    });
};

function mailHash(mailType, mailIdentifier, mailUser) {
    return crypto.createHash('sha256').
        update(mailType).update(mailIdentifier.toString()).update(mailUser.toString()).digest('hex');
}

function sendMail(mailTo, mailSubject, mailText) {
    var mailOptions = {
        from: '"Evocracy Project" <noreply@openevocracy.org>', // sender address
        to: mailTo, // list of receivers
        subject: mailSubject, // Subject line
        text: mailText//, // plaintext body
        //html: '<b>Welcome/b>' // html body
    };
    
    if(cfg.MAIL) {
        transporter.sendMail(mailOptions, function(error, info){
            if(error)
                return console.log(error);
            console.log('Message sent: ' + info.response);
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

function sendEmailToAllActiveGroupMembers(mailType, topic, mailSubject, mailText) {
    // Remind members that the deadline of the level (group) is coming
    return db.collection('groups').find({ 'tid': topic._id, 'level': topic.level }).
    toArrayAsync().then(function(groups) {
        return db.collection('group_members').
            find({ 'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
    }).then(function(members) {
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMailOnce(user.email, mailSubject, mailText, mailHash(mailType, topic._id, user._id));
        return Promise.resolve();
    });
}
exports.sendEmailToAllActiveGroupMembers = sendEmailToAllActiveGroupMembers;

function sendEmailToAllLazyGroupMembers(mailType, topic, mailSubject, mailText) {
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
                var member = utils.findWhereArrayEntryExists(members, {'uid': user._id});
                sendMailOnce(user.email, mailSubject, mailText, mailHash(mailType, member._id, user._id), cfg.REMINDER_GROUP_LAZY);
                return Promise.resolve();
            });
    });
}
exports.sendEmailToAllLazyGroupMembers = sendEmailToAllLazyGroupMembers;

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
            i18n.initAsync.then(function() {
                sendEmailToAllLazyGroupMembers('EMAIL_ALL_LAZY_GROUP_MEMBERS',
                    topic,strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_MESSAGE'),
                              topic.name, getTimeString(cfg.REMINDER_GROUP_LAZY))
                );
            });
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
