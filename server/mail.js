var _ = require('underscore');
var requirejs = require('requirejs');
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var crypto = require('crypto');

var db = require('./database').db;
var utils = require('./utils');

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
        // filter out group members with timestamps older than five days
        return Date.now() >= member.lastActivity + cfg.REMINDER_GROUP_LAZY;
    }).then(function(members) {
        // update last activity timestamp
        return db.collection('group_members').
            updateAsync(
                { 'uid': { $in: _.pluck(members, 'uid') } },
                { $set: {'lastActivity': Date.now()} },
                { multi: true }
            ).return(members);
    }).then(function(members) {
        // get the users
        return db.collection('users').
            find({ '_id': { $in: _.pluck(members, 'uid') } }, {'email': true}).
            toArrayAsync();
    }).map(function(user) {
        sendMail(user.email, mailSubject, mailText); // FIXME mailSubject and mailText are empty!
        return Promise.resolve();
    });
}
exports.sendEmailToAllLazyGroupMembers = sendEmailToAllLazyGroupMembers;

exports.sendTopicReminderMessages = function(topic) {
    switch (topic.stage) {
        case C.STAGE_PROPOSAL: // we are currently in proposal stage
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_SECOND) {
                return sendEmailToAllTopicParticipants(
                    topic,
                    'Proposal reminder: ' + topic.name,
                    'You are participant of topic ' + topic.name + '. ' +
                    'The topic will enter consensus stage in 24 hours.\r\n' +
                    'We suggest to read your proposal once again at that time,' +
                    'to eliminate last mistakes in your text.'
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_PROPOSAL_FIRST) {
                return sendEmailToAllTopicParticipants(
                    topic,
                    'Proposal reminder: ' + topic.name,
                    'You are a participant of topic ' + topic.name + '. ' +
                    'The topic will enter consensus stage in 3 days.\r\n' +
                    'We highly suggest to check your proposal for final corrections.'
                );
            }
            break;
        case C.STAGE_CONSENSUS: // we are currently in consensus stage
            sendEmailToAllLazyGroupMembers(
                topic,
                'Group inactivity reminder: ' + topic.name,
                'You are a member of a group in ' + topic.name + '. ' +
                'You were not active for 5 days in your group.\r\n' +
                'Let\'s have a look at your common document, ' +
                'probably someone added something new.'
            );
            if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_SECOND) {
                return sendEmailToAllActiveGroupMembers(
                    topic,
                    'Group reminder: ' + topic.name,
                    'You are a member of a group in ' + topic.name + '. ' +
                    'The topic will enter consensus stage in 24 hours.\r\n' +
                    'We suggest to read your collaborative document once again ' +
                    'at that time, to eliminate last mistakes in your common text.'
                );
            } else if(Date.now() >= topic.nextDeadline-cfg.REMINDER_GROUP_FIRST) {
                return sendEmailToAllActiveGroupMembers(
                    topic,
                    'Group reminder: ' + topic.name,
                    'You are a member of a group in ' + topic.name + '. ' +
                    'The current level will end in 3 days.\r\n' +
                    'We highly suggest to check your collaborative document ' +
                    'for final corrections.'
                );
            }
            break;
    }
    
    return Promise.resolve();
}
