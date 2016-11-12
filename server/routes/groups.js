var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var Chance = require('chance');
var requirejs = require('requirejs');
var strformat = require('strformat');

var C = requirejs('public/js/setup/constants');
var cfg = requirejs('public/js/setup/configs');
var i18n = require('../i18n');
var ratings = require('./ratings');
var pads = require('../pads');
var mail = require('../mail');
var utils = require('../utils');

function calculateNumberOfGroups(numTopicParticipants) {
    
    // constants
    var groupSize = 4.5; // group size is 4 or 5
    var limitSimpleRule = 50; // number of topic_participants (if more then x topic_participants, complex rule is used)
    // calculated values
    var groupMinSize = (groupSize-0.5);
    var groupMaxSize = (groupSize+0.5);
    
    var numGroups;
    if(numTopicParticipants>limitSimpleRule)
        numGroups = numTopicParticipants/groupSize; // simple rule, ideally all groups are 5, group size 4 only exception
    else
        numGroups = numTopicParticipants/groupMaxSize; // complex rule, 4 and 5 uniformly distributed
    numGroups = Math.ceil(numGroups); // round up to next integer
    console.log('rounded groups: '+numGroups);
    
    return numGroups;
}

function assignParticipantsToGroups(participants) {
    // shuffle topic_participants
    _.shuffle(participants);
    
    // compute number of groups
    var numGroups = calculateNumberOfGroups(_.size(participants));
    
    // initialize empty groups
    var groups = new Array(numGroups);
    for(var i=0; i<numGroups; ++i)
        groups[i] = [];
    
    // push topic_participants into groups
    _.each(participants, function(participant) {
        // find first smallest group
        var group = _.min(groups, function(group) {return _.size(group);});
        group.push(participant.uid);
    });
    
    // TODO log with logging library
    // log group member distribution
    var counts = _.countBy(groups, function(group) {return _.size(group);});
    console.log('groups filled: ' + JSON.stringify(counts));
    
    return groups;
}

function storeGroupAsync(gid,tid,level,group) {
    var ppid = ObjectId();
    
    // create group's proposal
    var create_proposal_promise =
    db.collection('proposals').insertAsync({
        '_id': ppid, 'source': gid,
        'pid': ObjectId()});
    
    // create group itself
    var create_group_promise =
    db.collection('groups').insertAsync({
        '_id': gid, 'tid': tid,
        'ppid': ppid, 'level': level});
    
    // insert group member
    var insert_members_promise =
    db.collection('group_members').insertAsync(
        _.map(group, function(uid) {
            return { 'gid': gid, 'uid': uid, 'lastActivity': -1 };
        }));
    
    return Promise.join(create_proposal_promise,
                        create_group_promise,
                        insert_members_promise);
}

function isProposalValid(proposal) {
    return proposal.body.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+\b/).length >= cfg.MIN_WORDS_PROPOSAL;
}

exports.createGroupsAsync = function(topic) {
    var tid = topic._id;
    
    // find topic_participants
    return db.collection('topic_participants').find({ 'tid': tid }).
    toArrayAsync().then(function(participants) {
        return db.collection('proposals').find({'tid': tid}).toArrayAsync().
            map(function(proposal) {
                proposal.body = pads.getPadHTMLAsync(proposal.pid);
                return Promise.props(proposal);
            }).then(function(proposals) {
                // accept only participants that have a corresponding proposal
                // and it is valid
                return _.filter(participants, function(participant) {
                    var proposal = utils.findWhereArrayEntryExists(proposals, {'source': participant.uid});
                    return _.isUndefined(proposal) ? false : isProposalValid(proposal);
                });
            });
    }).then(assignParticipantsToGroups).map(function(group) {
        // create new group id
        var gid = ObjectId();
        
        // send mail to notify new group users
        var send_mail_promise =
        db.collection('users').find({'_id': { $in: group }},{'email': true}).
        toArrayAsync().then(function(users) {
            mail.sendMail(_.pluck(users,'email').join(),
                strformat(i18n.t('EMAIL_CONSENSUS_START_SUBJECT'), topic.name),
                strformat(i18n.t('EMAIL_CONSENSUS_START_MESSAGE'), topic.name, gid.toString())
            );
        });
        
        // create notifications for users
        // FIXME correct?? kann man das mit oben kombinieren?
        /*var save_notification_promise =
        db.collection('users').find({'_id': { $in: group }},{'uid': true}).
        toArrayAsync().then(function(users) {
            return db.collection('user_notifications').insertAsync(
                _.map(group, function(uid) {
                    return {
                    'uid': uid,
                    'type': 'info',
                    'text': 'You entered a new <a href="http://mind-about-sagacitysite.c9.io/group/'+
                                    gid.toString()+'">group</a>'
                    }}));
        });*/
        
        
        // store group in database
        var store_group_promise = storeGroupAsync(gid, tid, 0, group);
        
        // create members for this group
        // append gid to proposal so we can identify it later
        var update_source_proposals_promise =
        db.collection('proposals').updateAsync(
            { 'tid': tid, 'source': { $in: group } },
            { $set: { 'sink': gid } }, {'multi': true});
        
        return Promise.join(
                send_mail_promise,
                store_group_promise,
                update_source_proposals_promise).return(group);
    });
};

exports.remixGroupsAsync = function(topic) {
    var tid = topic._id;
    
    // get groups with highest level
    return db.collection('groups').find({ 'tid': tid, 'level': topic.level }).
    toArrayAsync().filter(function (group) {
        return db.collection('proposals').findOneAsync({'source': group._id}).
        then(function(proposal) {
            proposal.body = pads.getPadHTMLAsync(proposal.pid);
            return Promise.props(proposal);
        }).then(function(proposal) {
            return isProposalValid(proposal);
        });
    }).then(function (groups) {
        if(_.isEmpty(groups))
            return Promise.reject({reason: 'REJECTED_NO_VALID_GROUP_PROPOSAL'});
        else
            return groups;
    }).map(function(group_in) {
        return ratings.getGroupLeader(group_in._id);
    }).then(function(leaders) {
        // remove all undefined leaders
        leaders = _.compact(leaders);
        var numLeaders = _.size(leaders);
        
        if(1 == numLeaders) {
            // if there is only ONE leader, then the topic is finished/passed.
            // send mail to notifiy about finished topic and return stage
            return db.collection('topic_participants').find({ 'tid': topic._id }).
            toArrayAsync().then(function(participants) {
                return db.collection('users').find({'_id': { $in: _.pluck(participants, 'uid') }},{'email': true}).
                toArrayAsync().then(function(users) {
                    mail.sendMail(_.pluck(users,'email').join(),
                        strformat(i18n.t('EMAIL_TOPIC_PASSED_SUBJECT'), topic.name),
                        strformat(i18n.t('EMAIL_TOPIC_PASSED_MESSAGE'), topic.name, topic._id)
                    );
                });
            }).return({'nextStage': C.STAGE_PASSED});
        } else if(0 == numLeaders) {
            // if there is NO leader, then the consensus stage has failed.
            return Promise.reject({reason: 'REJECTED_UNSUFFICIENT_RATINGS'});
        }
        
        // assign members to groups
        var groups = assignParticipantsToGroups(leaders);
        
        // insert all groups into database
        var nextLevel = topic.level+1;
        return Promise.map(groups, function(group) {
            // create group new id
            var gid = ObjectId();
            
            // store group in database
            var store_group_promise = storeGroupAsync(gid,tid,nextLevel,group);
                    
            // send mail to notify level change
            var send_mail_promise =
            db.collection('users').find({'_id': { $in: group }},{'email': true}).
            toArrayAsync().then(function(users) {
                mail.sendMail(_.pluck(users,'email').join(),
                    strformat(i18n.t('EMAIL_LEVEL_CHANGE_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_LEVEL_CHANGE_MESSAGE'), topic.name, gid.toString())
                );
            });
            
            // register as sink for source proposals
            // find previous gids corresponding uids in group_out (current group)
            var update_source_proposals_promise =
            db.collection('group_members').findAsync({'uid': { $in: group }}).
            then(function(members) {
                var gids = _.pluck(members,'gid');
                
                // filter out only previous level proposals
                var prevLevel = topic.level;
                return db.collection('groups').findAsync(
                    {'level': prevLevel, 'gid': { $in: gids }}, {'gid': true});
            }).then(function(source_groups) {
                var sources = _.pluck(source_groups,'gid');
                
                // update sink of previous proposals
                return db.collection('proposals').updateAsync(
                    { 'tid': tid, 'source': { $in: sources } },
                    { $set: { 'sink': gid } }, {'multi': true});
            });
            
            return Promise.join(
                send_mail_promise,
                store_group_promise,
                update_source_proposals_promise);
        }).return({'nextStage': C.STAGE_CONSENSUS}); // we stay in consensus stage
    }).catch(utils.isOwnError,function(error) {
        return {
            'nextStage': C.STAGE_REJECTED,
            'rejectedReason': error.reason
        };
    });
};

exports.list = function(req, res) {
    db.collection('groups').find().toArrayAsync().then(_.bind(res.json,res));
};

function getMemberProposalBodyAndRating(member, gid, uid) {
    return db.collection('proposals').findOneAsync(
        {'source': member._id, 'sink': gid}).then(function(proposal) {
        // get proposal body
        var proposal_body_promise = pads.getPadHTMLAsync(proposal.pid);
        
        // get proposal rating
        var proposal_knowledge_promise = 
        db.collection('ratings').findOneAsync(
            {'rppid': proposal._id, 'gid': gid, 'uid': uid},{'score': 1}).
        then(function(rating) {
            return rating ? rating.score : 0;
        });
        
        return Promise.props({
            'ppid': proposal._id,
            'proposal_body': proposal_body_promise,
            'knowledge_rating': proposal_knowledge_promise
        });
    });
}

// get group by id
exports.query = function(req, res) {
    
    var gid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    // get group
    var group_promise = db.collection('groups').findOneAsync({'_id': gid});
    
    // get group proposal pad id
    var pid_promise = group_promise.then(function(group) {
        return db.collection('proposals').findOneAsync(
            {'_id': group.ppid},{'pid': true});
    });
    
    // get all group members
    var members_promise =
    db.collection('group_members').find({'gid': gid}, {'uid': true}).
    //map(function(member) {return member.uid;}).
    toArrayAsync().map(function(member) {
        return member.uid;
    }).then(function(uids) {
        return db.collection('users').
            find({'_id': { $in: uids }},{'_id': true, 'name': true}).
            toArrayAsync();
    }).map(function (member) {
        // generate member name
        var chance = new Chance(gid+member._id);
        member.name = chance.first();
        member.color = chance.color({format: 'shorthex'});
        
        // get member's proposal body and rating
        var proposal_body_and_rating_promise =
            getMemberProposalBodyAndRating(member,gid,uid);
        
        // get member rating
        var member_rating_promise =
        db.collection('ratings').findOneAsync(
            {'ruid': member._id, 'gid': gid, 'uid': uid},{'score': true}).
        then(function(rating) {
            return rating ? rating.score : 0;
        });
        
        return Promise.join(proposal_body_and_rating_promise,
                            member_rating_promise).
        spread(function(proposal_body_and_rating,
                        member_rating) {
            return _.extend(member,proposal_body_and_rating,
                            {'member_rating': member_rating});
        });
    });
    
    // set the timestamp for the member just querying the group
    var set_member_timestamp_promise =
    db.collection('group_members').updateAsync(
        {'gid': gid, 'uid': uid},
        {$set: {'lastActivity': Date.now()}});
    
    Promise.join(group_promise,
                 pid_promise,
                 members_promise,
                 set_member_timestamp_promise).
    spread(function(group,pid,members) {
        return _.extend(group,pid,{'members': members});}).
    then(res.json.bind(res));
};
