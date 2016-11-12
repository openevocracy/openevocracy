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

function sendMailOnce(mailTo, mailSubject, mailText) {
    var hash = crypto.createHash('sha256').
        update(mailTo).update(mailSubject).update(mailText).digest('hex');
    
    return db.collection('mail').findOneAsync({ 'hash': hash }).then(function(hashFromDb) {
        if(hashFromDb)
            return Promise.resolve();
        
        sendMail(mailTo, mailSubject, mailText);
        return db.collection('mail').insertOneAsync({ 'hash': hash });
    });
}
exports.sendMailOnce = sendMailOnce;

function sendEmailToAllTopicParticipants(topic, mailSubject, mailText) {
    return db.collection('topic_participants').find({'tid': topic._id}, {'uid': true}).
    toArrayAsync().then(function(participants) {
        return db.collection('users').
            find({ '_id': { $in: _.pluck(participants, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMailOnce(user.email, mailSubject, mailText);
        return Promise.resolve();
    });
}
exports.sendEmailToAllTopicParticipants = sendEmailToAllTopicParticipants;

function sendEmailToAllActiveGroupMembers(topic, mailSubject, mailText) {
    return db.collection('groups').find({ 'tid': topic._id, 'level': topic.level }).
    toArrayAsync().then(function(groups) {
        return db.collection('group_members').
            find({ 'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
    }).then(function(members) {
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMailOnce(user.email, mailSubject, mailText);
        return Promise.resolve();
    });
}
exports.sendEmailToAllActiveGroupMembers = sendEmailToAllActiveGroupMembers;

function sendEmailToAllLazyGroupMembers(topic, mailSubject, mailText) {
    return db.collection('groups').find({ 'tid': topic._id, 'level': topic.level }).
    toArrayAsync().then(function(groups) {
        return db.collection('group_members').
            find({ 'gid': { $in: _.pluck(groups, '_id') } }).toArrayAsync();
    }).filter(function(member) {
        // only notify group members with timestamps older than five days or -1 (never logged in)
        var lastActivity = member.lastActivity == -1 ? member._id.getTimestamp() : member.lastActivity;
        return Date.now() >= lastActivity + cfg.REMINDER_GROUP_LAZY;
    }).then(function(members) {
        // update last activity timestamp
        return db.collection('group_members').
            updateAsync(
                { 'uid': { $in: _.pluck(members, 'uid') } },
                { $set: {'lastActivity': Date.now()} },
                //{ $set: {'lastLazyMail': Date.now()} },
                { multi: true }
            ).return(members);
    }).then(function(members) {
        // get the users
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMail(user.email, mailSubject, mailText);
        return Promise.resolve();
    });
}
exports.sendEmailToAllLazyGroupMembers = sendEmailToAllLazyGroupMembers;

exports.sendTopicReminderMessages = function(topic) {
    switch (topic.stage) {
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_SECOND) {
                return sendEmailToAllTopicParticipants(
                    topic,strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_SECOND_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_SECOND_MESSAGE'), topic.name)
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_FIRST) {
                return sendEmailToAllTopicParticipants(
                    topic,strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_FIRST_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_REMINDER_PROPOSAL_FIRST_MESSAGE'), topic.name)
                );
            }
            break;
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            i18n.initAsync.then(function() {
                sendEmailToAllLazyGroupMembers(
                    topic,strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_LAZY_GROUP_MEMBERS_MESSAGE'), topic.name)
                );
            });
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_SECOND) {
                return sendEmailToAllActiveGroupMembers(
                    topic,strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_FIRST_MESSAGE'), topic.name)
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_FIRST) {
                return sendEmailToAllActiveGroupMembers(
                    topic,strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_ALL_ACTIVE_GROUP_MEMBERS_SECOND_MESSAGE'), topic.name)
                );
            }
            break;
    }
    
    return Promise.resolve();
};
