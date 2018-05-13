var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var Chance = require('chance');
var Color = require('color');
//var requirejs = require('requirejs');

var C = require('../../shared/constants').C;
//var cfg = requirejs('public/js/setup/configs');
var cfg = require('../../shared/config').cfg;
var ratings = require('./ratings');
var topics = require('./topics');
var pads = require('./pads');
var mail = require('../mail');
var utils = require('../utils');

function getGroupMembersAsync(gid) {
    return db.collection('group_members').find({'gid': gid}, {'uid': true}).
        toArrayAsync();
}

function calculateNumberOfGroups(numTopicParticipants) {
    
    // TODO throw error if group size is smaller than 3
    //if(cfg.GROUP_SIZE < 3)
    
    var numGroups = Math.ceil(numTopicParticipants/cfg.GROUP_SIZE); // round up to next integer
    console.log('number of groups: ', numGroups);
    
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

function storeGroupAsync(gid, tid, nextDeadline, level, members) {
    // create group proposal's pad
    var pid = ObjectId();
    // The deadline is actually the deadline of the next stage (not the old one).
    var pad = { '_id': pid, 'expiration': nextDeadline };
    var create_pad_promosal_promise = pads.createPadAsync(pad);
    
    // create group's proposal
    var ppid = ObjectId();
    var create_proposal_promise =
    db.collection('topic_proposals').insertAsync({
        '_id': ppid, 'tid': tid,
        'source': gid, 'pid': pid});
    
    // create group itself
    var crid = ObjectId();
    var create_group_promise =
    db.collection('groups').insertAsync({
        '_id': gid, 'tid': tid,
        'ppid': ppid, 'crid': crid,
        'level': level});
    
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
    var proposal_words = proposal.body.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+\b/).length;
    return proposal_words >= cfg.MIN_WORDS_PROPOSAL;
}

/**
 * initial creation of groups after proposal stage
 * - check if user proposals are valid (filter participants)
 * - randomly assign participants to groups
 */
exports.createGroupsAsync = function(topic) {
    var tid = topic._id;
    
    var validParticipantsPromise = db.collection('topic_proposals').find({ 'tid': tid })
    .toArrayAsync().map(function(proposal) {
        return pads.getPadHTMLAsync(proposal.pid).then(function(body) {
            proposal.body = body;
            return proposal;
        });
    }).then(function(proposals) {
        return _.filter(_.pluck(proposals, 'source'), function(source) {
            var proposal = utils.findWhereObjectId(proposals, {'source': source});
            return _.isUndefined(proposal) ? false : isProposalValid(proposal);
        });
    });
    
    var storeValidParticipantsPromise =
    validParticipantsPromise.then(function(valid_participants) {
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
            mail.sendMailMulti(users,
                'EMAIL_CONSENSUS_START_SUBJECT', [topic.name],
                'EMAIL_CONSENSUS_START_MESSAGE', [topic.name, gid.toString(), cfg.BASE_URL]);
        });
        
        // store group in database
        var tid = topic._id;
        var nextDeadline = topic.nextDeadline;
        var store_group_promise = storeGroupAsync(gid, tid, nextDeadline, 0, group_members);
        
        // create members for this group
        // append gid to proposal so we can identify it later
        var update_source_proposals_promise =
        db.collection('topic_proposals').updateAsync(
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

function getGroupsOfSpecificLevelAsync(tid, level) {
    return db.collection('groups').find({ 'tid': tid, 'level': level }).toArrayAsync();
}
exports.getGroupsOfSpecificLevelAsync = getGroupsOfSpecificLevelAsync;

function getValidGroupsOfSpecificLevelAsync(tid, level) {
    return getGroupsOfSpecificLevelAsync(tid, level).filter(function (group) {
        return db.collection('topic_proposals').findOneAsync({'source': group._id}).
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
            return Promise.resolve(groups);
    });
}

/**
 * create of groups after level is finished
 * - check if group proposals are valid (filter groups)
 * - find group leader (with highest rating)
 * - randomly assign participants to new groups
 */
exports.remixGroupsAsync = function(topic) {
    var tid = topic._id;
    
    // Get groups with highest level
    var groupsPromise = getValidGroupsOfSpecificLevelAsync(tid, topic.level);
    
    // Get group leaders
    var leadersPromise = groupsPromise.map(function(group_in) {
        var gid = group_in._id;
        
        return ratings.getGroupLeaderAsync(gid).then(function(leader) {
            if(!_.isUndefined(leader))
                return Promise.resolve(leader);
            
            // if group leader is undefined, pick one randomly
            return getGroupMembersAsync(gid).then(function(members) {
                return Promise.resolve(_.sample(members).uid);
            });
        });
    });
    
    return Promise.join(groupsPromise, leadersPromise).spread(function(groups, leaders) {
        // If there is only ONE group in the current topic level,
        // then the topic is finished/passed.
        if(1 == _.size(groups)) {
            // Send mail to notifiy about finished topic and return next stage.
            return db.collection('groups').find({ 'tid': topic._id, 'level': 0 }).
                toArrayAsync().then(function(groups) {
                    return db.collection('group_members').find({'gid': { $in: _.pluck(groups, '_id') }}, {'uid': true}).
                        toArrayAsync();
                }).then(function(participants) {
                    return db.collection('users').find({'_id': { $in: _.pluck(participants, 'uid') }}, {'email': true}).
                        toArrayAsync().then(function(users) {
                            mail.sendMailMulti(users,
                                'EMAIL_TOPIC_PASSED_SUBJECT', [topic.name],
                                'EMAIL_TOPIC_PASSED_MESSAGE', [topic.name, topic._id, cfg.BASE_URL]);
                        });
                }).return({'nextStage': C.STAGE_PASSED});
        }
        
        // assign members to groups
        var groups_members = assignParticipantsToGroups(leaders);
        
        // insert all groups into database
        var nextLevel = topic.level+1;
        return Promise.map(groups_members, function(group_members) {
            // create group new id
            var gid = ObjectId();
            
            // store group in database
            var tid = topic._id;
            var prevDeadline = topic.nextDeadline;
            var nextDeadline = topics.calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
            var store_group_promise = storeGroupAsync(gid, tid, nextDeadline, nextLevel, group_members);
            
            // send mail to notify level change
            var send_mail_promise =
            db.collection('users').find({'_id': { $in: group_members }},{'email': true}).
            toArrayAsync().then(function(users) {
                mail.sendMailMulti(users,
                    'EMAIL_LEVEL_CHANGE_SUBJECT', [topic.name],
                    'EMAIL_LEVEL_CHANGE_MESSAGE', [topic.name, gid.toString(), cfg.BASE_URL]);
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
                return db.collection('topic_proposals').updateAsync(
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

function getProposalBodyAsync(mid, gid, proposals_source_promise) {
    // mid: member id, gid: group id
    return db.collection('topic_proposals').findOneAsync(
        {'source': mid, 'sink': gid},{'pid': true}).then(function(proposal) {
        
        // Proposal was found
        // This means it was a user-created proposal
        if(!_.isNull(proposal))
            return Promise.resolve(proposal);
        
        // Proposal was not found: We have a group proposal
        // Find group where user was member in level before
        // and get proposal from that group
        return proposals_source_promise.then(function(proposals) {
            return db.collection('group_members').
                findOneAsync({'gid': {$in: _.pluck(proposals, 'source')}, 'uid': mid },{'gid': true}).
                then(function(group_member) {
                    return utils.findWhereObjectId(proposals, {'source': group_member.gid});
                });
        });
    }).then(function(proposal) {
        return pads.getPadHTMLAsync(proposal.pid);
    });
}

function getMemberRatingAsync(ruid, gid, uid, type) {
    return db.collection('ratings').findOneAsync(
        {'ruid': ruid, 'gid': gid, 'uid': uid, 'type': type},{'score': true}).
    then(function(rating) {
        return rating ? rating.score : 0;
    });
}

// get group by id
exports.query = function(req, res) {
	//var gpid = ObjectId(req.params.id);
	var gid = ObjectId(req.params.id);
	var uid = ObjectId(req.user._id);
	
	/*var proposal_promise = db.collection('topic_proposals').findOneAsync({'_id': gpid});
	
	// Get group id
	var gid_promise = proposal_promise.get('source');
	
	// Get topic
	var topic_promise = proposal_promise.then(function(proposal) {
		return db.collection('topics').findOneAsync(
			{'_id': proposal.tid}, {'nextDeadline': true, 'name': true, 'stage': true, 'level': true});
	});
	
	// Get all source proposals
	var proposals_source_promise = proposal_promise.then(function(proposal) {
		return db.collection('topic_proposals').find({'sink': proposal.source, 'tid': proposal.tid},
			{'source': true, 'pid': true}).toArrayAsync();
	});
	
	// Get group
	var group_promise = gid_promise.then(function(gid) {
		return db.collection('groups').findOneAsync({'_id': gid});
	});
	
	// Get all group members
	var get_members_promise = gid_promise.then(getGroupMembersAsync);*/
    
    console.log(gid);
    
    // Get group
    var group_promise = db.collection('groups').findOneAsync({'_id': gid});
    
    // Get group proposal pad id
    var proposal_promise = group_promise.then(function(group) {
        return db.collection('topic_proposals').findOneAsync(
            {'_id': group.ppid}, {'pid': true});
    });
    
    // Request topic to get info
    var topic_promise = group_promise.then(function(group) {
        return db.collection('topics').findOneAsync(
            {'_id': group.tid}, {'nextDeadline': true, 'name': true, 'stage': true, 'level': true});
    });
    
    // Count number of groups in current level to obtain if we are in last level
	var last_level_promise = topic_promise.then(function(topic) {
		return db.collection('groups').countAsync({'tid': topic._id, 'level': topic.level}).
			then(function(numGroupsInCurrentLevel) {
				return (numGroupsInCurrentLevel == 1) ? 1 : 0;
		});
	});
    
    // Get alls source proposals
    var proposals_source_promise = group_promise.then(function(group) {
        return db.collection('topic_proposals').find({'sink': gid, 'tid': group.tid},
            {'source': true, 'pid': true}).toArrayAsync();
    });
    
    // Get all group members
    var get_members_promise = getGroupMembersAsync(gid);
    
    // generate group specific color_offset
    var chance = new Chance(gid.toString());
    var offset = chance.integer({min: 0, max: 360});
	
	/*var offset_promise = gid_promise.then(function(gid) {
		// generate group specific color_offset
		var chance = new Chance(gid.toString());
		return chance.integer({min: 0, max: 360});
	});*/
	
    // Additional member information
    var members_promise = get_members_promise.map(function(member) {
        return member.uid;
    }).then(function(uids) {
        return db.collection('users').
            find({'_id': { $in: uids }},{'_id': true, 'name': true}).
            toArrayAsync();
    }).map(function (member, index) {
        // generate member name and color
        var member_color_promise = get_members_promise.then(function (members) {
            var num_members = _.size(members);
            var hue = offset + index*(360/num_members);

            return Promise.resolve(Color({h: hue, s: 20, v: 100}).hex());
        });
        
        // get proposal body
        var proposal_body_promise = getProposalBodyAsync(member._id, gid, proposals_source_promise);
        
        // get member rating
        var member_rating_knowledge_promise = getMemberRatingAsync(member._id, gid, uid, C.RATING_KNOWLEDGE);
        var member_rating_integration_promise = getMemberRatingAsync(member._id, gid, uid, C.RATING_INTEGRATION);
        
        return Promise.props(_.extend(member, {
                             'name': chance.first(),
                             'color': member_color_promise,
                             'proposal_body': proposal_body_promise,
                             'rating_knowledge': member_rating_knowledge_promise,
                             'rating_integration': member_rating_integration_promise,
                             'gid': gid}));
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
        
        // append proposal body
        group.body = pads.getPadHTMLAsync(proposal.pid);
        
        // flash message in client if group not editable
        if( topic.stage != C.STAGE_CONSENSUS ||
           (topic.stage == C.STAGE_CONSENSUS && topic.level != group.level)) {
            
            // flash message in client
            group.alert = {type: "info", content: "GROUP_QUERIED_NOT_ACTIVE"};
        }
        
        return Promise.props(_.extend(group, {
            'pid': proposal.pid,
            'members': members,
            'nextDeadline': topic.nextDeadline,
            'title': topic.name,
            'lastLevel': lastLevel
        }));
    }).then(res.json.bind(res));
};
