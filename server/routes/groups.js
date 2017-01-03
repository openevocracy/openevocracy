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
    var limitSimpleRule = 50; // number of topic participants (if more then x topic participants, complex rule is used)
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
    // shuffle topic participants
    _.shuffle(participants);
    
    // compute number of groups
    var numGroups = calculateNumberOfGroups(_.size(participants));
    
    // initialize empty groups
    var groups = new Array(numGroups);
    for(var i=0; i<numGroups; ++i)
        groups[i] = [];
    
    // push topic participants into groups
    _.each(participants, function(participant) {
        // find first smallest group
        var group = _.min(groups, function(group) {return _.size(group);});
        group.push(participant);
    });
    
    // TODO log with logging library
    // log group member distribution
    var counts = _.countBy(groups, function(group) {return _.size(group);});
    console.log('groups filled: ' + JSON.stringify(counts));
    
    return groups;
}

function storeGroupAsync(gid, topic, level, members) {
    // create group proposal's pad
    var pid = ObjectId();
    var create_pad_promosal_promise =
    pads.createPadAsync(pid, topic.nextDeadline); // This is actually the deadline of the next stage (not the old one).
    
    // create group's proposal
    var ppid = ObjectId();
    var create_proposal_promise =
    db.collection('proposals').insertAsync({
        '_id': ppid, 'tid': topic._id,
        'source': gid, 'pid': pid});
    
    // create group itself
    var create_group_promise =
    db.collection('groups').insertAsync({
        '_id': gid, 'tid': topic._id,
        'ppid': ppid, 'level': level});
    
    // insert group members
    var insert_members_promise =
    db.collection('group_members').insertAsync(
        _.map(members, function(uid) {
            return { 'gid': gid, 'uid': uid, 'lastActivity': -1 };
        }));
    
    return Promise.join(create_pad_promosal_promise,
                        create_proposal_promise,
                        create_group_promise,
                        insert_members_promise);
}

function isProposalValid(proposal) {
    return proposal.body.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+\b/).length >= cfg.MIN_WORDS_PROPOSAL;
}

/**
 * initial creation of groups after proposal stage
 * - check if user proposals are valid (filter participants)
 * - randomly assign participants to groups
 */
exports.createGroupsAsync = function(topic) {
    var tid = topic._id;
    
    var validParticipantsPromise = db.collection('proposals').find({ 'tid': tid }).
    toArrayAsync().map(function(proposal) {
        proposal.body = pads.getPadHTMLAsync(proposal.pid);
        return proposal;
    }).then(function(proposals) {
        return _.filter(_.pluck(proposals, 'source'), function(source) {
            var proposal = utils.findWhereArrayEntryExists(proposals, {'source': source});
            return _.isUndefined(proposal) ? false : isProposalValid(proposal);
        });
    });
    
    var storeValidParticipantsPromise =
    validParticipantsPromise.then(function(valid_participants) {
        console.log('valid_participants',valid_participants);
        return db.collection('topics').updateAsync(
            { '_id': topic._id },
            { $set: { 'valid_participants': _.size(valid_participants) } });
    });
    
    var createGroupsPromise =
    validParticipantsPromise.then(function(valid_participants) {
        return assignParticipantsToGroups(valid_participants);
    }).map(function(group_members) {
        // create new group id
        var gid = ObjectId();
        
        // TODO Notifications
        // Send mail to notify new group members
        var send_mail_promise =
        db.collection('users').find({'_id': { $in: group_members }},{'email': true}).
        toArrayAsync().then(function(users) {
            mail.sendMail(_.pluck(users,'email').join(),
                strformat(i18n.t('EMAIL_CONSENSUS_START_SUBJECT'), topic.name),
                strformat(i18n.t('EMAIL_CONSENSUS_START_MESSAGE'), topic.name, gid.toString())
            );
        });
        
        // store group in database
        var store_group_promise = storeGroupAsync(gid, topic, 0, group_members);
        
        // create members for this group
        // append gid to proposal so we can identify it later
        var update_source_proposals_promise =
        db.collection('proposals').updateAsync(
            { 'tid': tid, 'source': { $in: group_members } },
            { $set: { 'sink': gid } }, {'upsert': false, 'multi': true});
        
        return Promise.join(
                send_mail_promise,
                store_group_promise,
                update_source_proposals_promise).return(group_members);
    });
    
    return Promise.join(
            createGroupsPromise,
            storeValidParticipantsPromise).get(0);
};

/**
 * create of groups after level is finished
 * - check if group proposals are valid (filter groups)
 * - find group leader (with highest rating)
 * - randomly assign participants to new groups
 */
exports.remixGroupsAsync = function(topic) {
    var tid = topic._id;
    
    // Get groups with highest level
    var groupsPromise = db.collection('groups').find({ 'tid': tid, 'level': topic.level }).
    toArrayAsync().filter(function (group) {
        return db.collection('proposals').findOneAsync({'source': group._id}).
        then(function(proposal) {
            // Get HTML from document
            proposal.body = pads.getPadHTMLAsync(proposal.pid);
            return Promise.props(proposal);
        }).then(function(proposal) {
            // Check if proposal is valid
            return isProposalValid(proposal);
        });
    }).then(function (groups) {
        // If no valid proposal exists: reject, otherwise return all valid groups
        if(_.isEmpty(groups))
            return Promise.reject({reason: 'REJECTED_NO_VALID_GROUP_PROPOSAL'});
        else
            return groups;
    });
    
    var leadersPromise = groupsPromise.map(function(group_in) {
        return ratings.getGroupLeader(group_in._id);
    });
    
    return Promise.join(groupsPromise, leadersPromise).spread(function(groups, leaders) {
        // remove all undefined leaders
        leaders = _.compact(leaders);
        var numLeaders = _.size(leaders);
        
        if(1 == groups.length) {
            // If there is only ONE group in the current topic level,
            // then the topic is finished/passed
            // Send mail to notifiy about finished topic and return stage
            return db.collection('groups').find({ 'tid': topic._id, 'level': 0 }).
                toArrayAsync().then(function(groups) {
                    return db.collection('group_members').find({'gid': { $in: _.pluck(groups, '_id') }}, {'uid': true}).
                        toArrayAsync();
                }).then(function(participants) {
                    return db.collection('users').find({'_id': { $in: _.pluck(participants, 'uid') }}, {'email': true}).
                        toArrayAsync().then(function(users) {
                            mail.sendMail(_.pluck(users,'email').join(),
                                strformat(i18n.t('EMAIL_TOPIC_PASSED_SUBJECT'), topic.name),
                                strformat(i18n.t('EMAIL_TOPIC_PASSED_MESSAGE'), topic.name, topic._id)
                            );
                        });
                }).return({'nextStage': C.STAGE_PASSED});
        } else if(0 == numLeaders) {
            // If there is NO leader and group length is greater than ONE (if above),
            // then the consensus stage has failed
            return Promise.reject({reason: 'REJECTED_UNSUFFICIENT_RATINGS'});
        }
        
        // assign members to groups
        var groups_members = assignParticipantsToGroups(leaders);
        
        // insert all groups into database
        var nextLevel = topic.level+1;
        return Promise.map(groups_members, function(group_members) {
            // create group new id
            var gid = ObjectId();
            
            // store group in database
            var store_group_promise = storeGroupAsync(gid, topic, nextLevel, group_members);
            
            // send mail to notify level change
            var send_mail_promise =
            db.collection('users').find({'_id': { $in: group_members }},{'email': true}).
            toArrayAsync().then(function(users) {
                mail.sendMail(_.pluck(users,'email').join(),
                    strformat(i18n.t('EMAIL_LEVEL_CHANGE_SUBJECT'), topic.name),
                    strformat(i18n.t('EMAIL_LEVEL_CHANGE_MESSAGE'), topic.name, gid.toString())
                );
            });
            
            // register as sink for source proposals
            // find previous gids corresponding uids in group_out (current group)
            var update_source_proposals_promise =
            db.collection('group_members').find({'uid': { $in: group_members }}).
            toArrayAsync().then(function(members) {
                var gids = _.pluck(members,'gid');
                
                // filter out only previous level proposals
                var prevLevel = topic.level;
                return db.collection('groups').find(
                    {'_id': { $in: gids }, 'level': prevLevel}, {'_id': true}).
                    toArrayAsync();
            }).then(function(source_groups) {
                var sources = _.pluck(source_groups,'_id');
                
                // update sink of previous proposals
                console.log(gid, tid, sources);
                return db.collection('proposals').updateAsync(
                    { 'tid': tid, 'source': { $in: sources } },
                    { $set: { 'sink': gid } }, {'upsert': false, 'multi': true});
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

function getMemberRating(ruid, gid, uid, type) {
    return db.collection('ratings').findOneAsync(
        {'ruid': ruid, 'gid': gid, 'uid': uid, 'type': type},{'score': true}).
    then(function(rating) {
        return rating ? rating.score : 0;
    });
}

// get group by id
exports.query = function(req, res) {
    
    var gid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    // Get group
    var group_promise = db.collection('groups').findOneAsync({'_id': gid});
    
    // Get group proposal pad id
    var proposal_promise = group_promise.then(function(group) {
        return db.collection('proposals').findOneAsync(
            {'_id': group.ppid}, {'pid': true});
    });
    
    // Request topics to get nextDeadline and topic name
    var topic_promise = group_promise.then(function(group) {
        return db.collection('topics').findOneAsync(
            {'_id': group.tid}, {'nextDeadline': true, 'name': true, 'level': true});
    });
    
    // Count number of groups in current level to obtain if we are in last level
    var last_level_promise = topic_promise.then(function(topic) {
        return db.collection('groups').countAsync({'tid': topic._id, 'level': topic.level}).
            then(function(numGroupsInCurrentLevel) {
                if(numGroupsInCurrentLevel == 1)
                    return 1;
                else
                    return 0; 
            });
    });
    
    // Get alls source proposals
    var proposals_source_promise = group_promise.then(function(group) {
        return db.collection('proposals').find({'sink': gid, 'tid': group.tid},
            {'source': true, 'pid': true}).toArrayAsync();
    });
    
    // Get all group members
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
        
        // get proposal body
        var proposal_body_promise = db.collection('proposals').findOneAsync(
            {'source': member._id, 'sink': gid},{'pid': true}).then(function(proposal) {
            
            // Proposal was found
            // This means it was a user-created proposal
            if(proposal)
                return proposal;
            
            // Find group where user was member in level before
            // and get proposal from that group
            return proposals_source_promise.then(function(proposals) {
                return db.collection('group_members').
                    findOneAsync({'gid': {$in: _.pluck(proposals, 'source')}, 'uid': member._id },
                        {'gid': true}).
                    then(function(group_member) {
                        return utils.findWhereArrayEntryExists(proposals, {'source': group_member.gid});
                    });
            });
        }).then(function(proposal) {
            return pads.getPadHTMLAsync(proposal.pid);
        });
        
        // get member rating
        var member_rating_knowledge_promise = getMemberRating(member._id, gid, uid, C.RATING_KNOWLEDGE);
        var member_rating_integration_promise = getMemberRating(member._id, gid, uid, C.RATING_INTEGRATION);
        
        return Promise.join(proposal_body_promise,
                            member_rating_knowledge_promise,
                            member_rating_integration_promise).
        spread(function(proposal_body,
                        member_rating_knowledge,
                        member_rating_integration) {
            return _.extend(member,
                            {'proposal_body': proposal_body},
                            {'rating_knowledge': member_rating_knowledge},
                            {'rating_integration': member_rating_integration},
                            {'gid': gid});
        });
    });
    
    // set the timestamp for the member just querying the group
    var set_member_timestamp_promise =
    db.collection('group_members').updateAsync(
        {'gid': gid, 'uid': uid},
        {$set: {'lastActivity': Date.now()}});
    
    Promise.join(group_promise,
                 proposal_promise,
                 members_promise,
                 topic_promise,
                 last_level_promise,
                 set_member_timestamp_promise).
    spread(function(group, proposal, members, topic, lastLevel) {
        return _.extend(group, {'pid': proposal.pid, 'members': members,
                        'nextDeadline': topic.nextDeadline, 'topicname': topic.name,
                        'lastLevel': lastLevel});
    }).then(res.json.bind(res));
};
