// General libraries
const _ = require('underscore');
const ObjectId = require('mongodb').ObjectID;
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const appRoot = require('app-root-path');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

// Own references
const C = require('../../shared/constants').C;
const cfg = require('../../shared/config').cfg;
const db = require('../database').db;
const utils = require('../utils');
const groups = require('./groups');
const pads = require('./pads');
const activities = require('./activities');

function calculateDeadline(nextStage, prevDeadline, levelDuration) {
    // define standard parameter
    if(_.isUndefined(levelDuration))
        levelDuration = cfg.DURATION_LEVEL;
    
    let nextDeadline = _.isUndefined(prevDeadline) ? Date.now() : prevDeadline;
    //let nextDeadline = Date.now();
    switch (nextStage) {
        case C.STAGE_SELECTION: // get selection stage deadline
            nextDeadline += cfg.DURATION_SELECTION;
            break;
        case C.STAGE_PROPOSAL: // get proposal stage deadline
            nextDeadline += cfg.DURATION_PROPOSAL;
            break;
        case C.STAGE_CONSENSUS: // get consensus stage deadline
            nextDeadline += levelDuration;
            break;
        case C.STAGE_PASSED:
        case C.STAGE_REJECTED:
            nextDeadline = cfg.DURATION_NONE;
            break;
    }
    
    return nextDeadline;
}
exports.calculateDeadline = calculateDeadline;

function manageConsensusStageAsync(topic, levelDuration) {
    // levelDuration is an optional parameter
    // it will get a default value in calculateDeadline if not set (for testing purposes)
    let prevDeadline = topic.nextDeadline;
    
    return groups.manage.remixGroupsAsync(topic).then(function(result) {
        let update_set_promise;
        switch(result.nextStage) {
        case C.STAGE_CONSENSUS:
            // updates below are only required while we are in consensus stage
            update_set_promise = {
                'level': (++topic.level),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline,levelDuration))
            };
            break;
        case C.STAGE_PASSED:
				let topicId = topic._id;
				
				// get the pad id of final document
				// e.g. the proposal pad id of the group in the last level
				const finalDocumentHtml_promise = db.collection('groups')
					.findOneAsync({ 'topicId': topicId, 'level': topic.level },{'_id': true})
					.then(function(group) {
						return db.collection('pads_group').findOneAsync({'groupId': group._id},{'docId': true}).get('docId');
				    }).then(function(docId) {
				    	return pads.getPadHTMLAsync('group', docId);
				    });
            
            // Get pad PDF and save it in file system
            finalDocumentHtml_promise.then(pads.getPadPDFAsync).then(function(data) {
                let filename = path.join(appRoot.path, 'files/documents', topicId+'.pdf');
                return fs.writeFileAsync(filename,data);
            });
            
            // Updates below are only required if consensus stage is over
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_PASSED),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_PASSED,prevDeadline)),
                'stagePassedStarted': Date.now(),
                'finalDocument': finalDocumentHtml_promise
            };
                        
            // Add activity for author
            const authorActivity_promise = activities.storeActivity(topic.owner, C.ACT_TOPIC_COMPLETE, topicId);
            
            // Add activities for interested persons (persons who voted for the respective topics)
				const interestedActivity_promise = db.collection('topic_votes')
					.find({'topicId': topicId}, {'userId': true}).toArrayAsync()
					.then(function(userVotes) {
							_.each(userVotes, function(el) {
									if (!utils.equalId(el.userId, topic.owner)) // if activity has not yet been added
										activities.storeActivity(el.userId, C.ACT_TOPIC_COMPLETE, topicId);
								});
						});
		
            break;
        case C.STAGE_REJECTED:
            // updates below are only required if topic was rejected
            update_set_promise = {
                'stage': (topic.stage = C.STAGE_REJECTED),
                'nextDeadline': (topic.nextDeadline = calculateDeadline(C.STAGE_REJECTED,prevDeadline)),
                'stageRejectedStarted': Date.now(),
                'rejectedReason': result.rejectedReason
            };
            break;
        default:
            return Promise.reject('unknown stage');
        }
        
        // update database
        return Promise.props(update_set_promise).then(function(update_set) {
            return db.collection('topics').updateAsync(
                _.pick(topic, '_id'), { $set: update_set }, {}).
                return(_.extend(topic, update_set));
        });
    });
}
exports.manageConsensusStage = manageConsensusStageAsync;

/**
 * checks if a minimum of MIN_VOTES_PER_TOPIC proposal exists
 */
async function isAccepted(topic) {
    const count = await db.collection('topic_votes').countAsync({'topicId': topic._id});
    
    return count >= cfg.MIN_VOTES_PER_TOPIC;
}

/**
 * gets all topics from database, call management of topic states and retun all topics
 * 
 * @return {object} topics - all adjusted topics
 */
function manageAndListTopicsAsync() {
	return lock.acquire('manageTopic', function() {
		return db.collection('topics').find().toArrayAsync()
			.map(_.partial(manageTopicStateAsync));
	});
}
exports.manageAndListTopicsAsync = manageAndListTopicsAsync;

/**
 * managment of topic states/levels
 * if deadline of state/level is expired, change state/level in database
 * and return changed topic
 * 
 * @param {object} topic - a topic from database
 * @return {object} topic - adjusted topic
 */
async function manageTopicStateAsync(topic) {
    
	// Exit this function if stage transition is not due yet
	if(Date.now() < topic.nextDeadline)
		return Promise.resolve(topic);
			
	// Move to next stage
	let prevDeadline = topic.nextDeadline;
	switch (topic.stage) {
		case C.STAGE_SELECTION: // we are currently in selection stage
			let stageStartedEntryName;
			if(await isAccepted(topic)) {
				// Topic does meet the minimum requirements for the next stage, move to next stage
				topic.stage = C.STAGE_PROPOSAL;
				topic.nextDeadline = calculateDeadline(C.STAGE_PROPOSAL,prevDeadline); // get deadline for proposal stage
				stageStartedEntryName = 'stageProposalStarted';
				topic[stageStartedEntryName] = Date.now();
			} else {
				// Topic has been rejected, move to rejection stage
				topic.stage = C.STAGE_REJECTED;
				topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VOTES';
				stageStartedEntryName = 'stageRejectedStarted';
				topic[stageStartedEntryName] = Date.now();
			}
			const updateTopicStatePromise = updateTopicStateAsync(topic,stageStartedEntryName);
			const updatePadExpirationPromise = db.collection('pads_topic_description').updateAsync(
				{ '_id': topic.pid }, { $set: { 'expiration': Date.now() }}
			);
			
			await Promise.join(updateTopicStatePromise, updatePadExpirationPromise);
			return topic;
		case C.STAGE_PROPOSAL: // we are currently in proposal stage
			// Set the next deadline here, so we can use it in createGroupsAsync.
			topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
			
			return groups.manage.createGroupsAsync(topic).then(function(groups) {
				let stageStartedEntryName;
				
				if(_.size(groups) >= cfg.MIN_GROUPS_PER_TOPIC) {
					topic.stage = C.STAGE_CONSENSUS;
					stageStartedEntryName = 'stageConsensusStarted';
				} else {
					topic.stage = C.STAGE_REJECTED;
					topic.nextDeadline = cfg.DURATION_NONE;
					topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VALID_USER_PROPOSALS';
					stageStartedEntryName = 'stageRejectedStarted';
				}
				
				topic[stageStartedEntryName] = Date.now();
				return Promise.join(topic, stageStartedEntryName);
			}).spread(function(topic, stageStartedEntryName) {
				return updateTopicStateAsync(topic, stageStartedEntryName).return(topic);
			});

			// ------------------------------------
			/*// Set the next deadline here, so we can use it in createGroupsAsync.
			topic.nextDeadline = calculateDeadline(C.STAGE_CONSENSUS,prevDeadline);
			
			const groups = await groups.manage.createGroupsAsync(topic);
				
			let stageStartedEntryName;
			if(_.size(groups) >= cfg.MIN_GROUPS_PER_TOPIC) {
				topic.stage = C.STAGE_CONSENSUS;
				stageStartedEntryName = 'stageConsensusStarted';
			} else {
				topic.stage = C.STAGE_REJECTED;
				topic.nextDeadline = cfg.DURATION_NONE;
				topic.rejectedReason = 'REJECTED_NOT_ENOUGH_VALID_USER_PROPOSALS';
				stageStartedEntryName = 'stageRejectedStarted';
			}
			
			topic[stageStartedEntryName] = Date.now();
			
			await updateTopicStateAsync(topic, stageStartedEntryName);
			return topic;*/
		case C.STAGE_CONSENSUS: // we are currently in consensus stage
			return manageConsensusStageAsync(topic);
	}
	
	return Promise.resolve(topic);
}

async function appendTopicInfoAsync(topic, userId, with_details) {
	const topicId = topic._id;
	
	// Get number of participants and votes in this topic
	const topic_votes = await db.collection('topic_votes')
		.find({'topicId': topicId}, {'userId': true}).toArrayAsync();
	const pads_proposal_count = await db.collection('pads_proposal').countAsync({'topicId': topicId});
    
	// TODO http://stackoverflow.com/questions/5681851/mongodb-combine-data-from-multiple-collections-into-one-how
	
	// Get groups and sort by level
	const groups = await db.collection('groups')
		.find({ 'topicId': topicId }, { 'level': true })
		.sort({ 'level': -1 }).toArrayAsync();
	
	// Number of participants per level
	const memberCountsPerGroups = await
	db.collection('group_relations').aggregateAsync( [
		{ $match: { 'groupId': { $in: _.pluck(groups, '_id') } } },
		{ $group: { '_id': '$groupId', member_count: { $sum : 1 } } } ] );
	
	const member_counts_per_groups_sorted_by_levels =
	_.groupBy(memberCountsPerGroups, function(member_count) {
		const group = utils.findWhereObjectId(groups, {'_id': member_count._id});
		return group.level;
	});
    
	const participants_per_levels =
	_.mapObject(member_counts_per_groups_sorted_by_levels,
	function(member_counts_per_groups, level) {
		return _.reduce(member_counts_per_groups,
			(memo, member_counts_per_group) => memo + member_counts_per_group.member_count, 0);
	});

	// Number of groups per level
	const groups_per_levels = _.countBy(groups, group => group.level);

	// Combine #participants and #groups
	const levels_object = _.mapObject(participants_per_levels,
		(participants_per_level, level) => ({ 'participants': participants_per_level, 'groups': groups_per_levels[level] }));
	const levels = _.toArray(levels_object);

	// Detailed data (not used in topic list, only in details)
	let user_group;
	if(with_details) {
		// Get topic description
		pad_description = await db.collection('pads_topic_description')
			.findOneAsync({'topicId': topicId}, { 'docId': true, 'ownerId': true })
			.then(pad => addHtmlToPad('topic_description', pad));

		// Get proposal of user
		user_proposal = await db.collection('pads_proposal')
			.findOneAsync({ 'topicId': topicId, 'ownerId': userId }, { 'docId': true, 'ownerId': true })
			.then(pad => _.isNull(pad) ? null : addHtmlToPad('proposal', pad));

		// Find the group that the current user is part of (in last level)
		// Get all groups in highest level
		const highest_level = _.max(groups, group => group.level).level;
		const highest_level_groups = _.filter(groups, group => group.level == highest_level);
		
		// Find that highest_level_groups, where user is part of and return that group
		const group_member = await db.collection('group_relations')
			.findOneAsync({'groupId': { $in: _.pluck(highest_level_groups, '_id') }, 'userId': userId});
		
		// Get group pad information
		if (group_member) {
			const group = utils.findWhereObjectId(highest_level_groups, {'_id': group_member.groupId});
			const pad = await db.collection('pads_group').findOneAsync({'groupId': group._id}, {'docId': true});
			
			// Add pad id, doc id and html to group
			const groupAndPad = _.extend(group, { 'padId': pad._id, 'docId': pad.docId });
			user_group = addHtmlToPad('group', groupAndPad);
		}
	}
	
	// Basic topic details
	const topic_without_details = await Promise.props(_.extend(topic,{
		'numVotes': _.size(topic_votes),
		'numProposals': pads_proposal_count,
		'voted': utils.checkArrayEntryExists(topic_votes, {'userId': userId}),
		'levels': levels
	}));
    
	// TODO Check if this is really a good way doing it
	
	if(with_details) {
		// Extended topic information for topic view
		return _.extend(topic_without_details, {
				'group': user_group,
				'proposal': user_proposal,
				'description': pad_description
			});
	} else {
		// Basic topic information for topic list
		return topic_without_details;
	}
}


async function addHtmlToPad(collection_suffix, pad) {
	const html = await pads.getPadHTMLAsync(collection_suffix, pad.docId);
	return Object.assign({'html': html}, pad);
}

/*
 * @desc: Get whole topiclist
 */
exports.getTopiclist = function(req, res) {
	const userId = ObjectId(req.user._id);
	
	manageAndListTopicsAsync().then(function(topics) {
		// Promise.map does not work above
		Promise.map(topics, _.partial(appendTopicInfoAsync, _, userId, false)).then(res.json.bind(res));
	}).catch(utils.isOwnError, utils.handleOwnError(res));
};

/*
 * @desc: Get a specific topiclist element
 */
exports.getTopiclistElement = async function(req, res) {
	const topicId = ObjectId(req.params.id);
	const userId = ObjectId(req.user._id);
	
	const topic = await db.collection('topics').findOneAsync({'_id': topicId});
	await manageTopicStateAsync(topic);
	
	const topicExt = await appendTopicInfoAsync(topic, userId, false);
	res.json(topicExt);
};

exports.update = async function(req, res) {
    const tid = ObjectId(req.params.id);
    const uid = ObjectId(req.user._id);
    const topicNew = req.body;
    
    const topic = await db.collection('topics').findOneAsync({ '_id': tid });
    
    // only the owner can update the topic
    if(!topic) {
        return utils.sendAlert(404, 'danger', 'TOPIC_NOT_FOUND');
    } else if(!_.isEqual(topic.owner,uid)) {
        return utils.sendAlert(403, 'danger', 'TOPIC_NOT_AUTHORIZED_FOR_UPDATE');
    } else if(topic.stage != C.STAGE_SELECTION) {
        return utils.sendAlert(403, 'danger', 'TOPIC_UPDATE_ONLY_IN_SELECTION_STAGE');
    }
    
    topic.name = topicNew.name;
    await db.collection('topics').updateAsync(
            { '_id': tid }, { $set: _.pick(topic, 'name') }, {});
    
    await manageTopicStateAsync(topic);
    
    const topicExt = await appendTopicInfoAsync(topic, uid, true);
    res.send(topicExt);
};

async function updateTopicStateAsync(topic,stageStartedEntryName) {
    return db.collection('topics').updateAsync(
        _.pick(topic, '_id'),
        { $set: _.pick(topic, 'stage', 'nextDeadline', 'rejectedReason', stageStartedEntryName) },
        {});
}

exports.query = async function(req, res) {
   const topicId = ObjectId(req.params.id);
   const userId = ObjectId(req.user._id);
   
   const topic = await db.collection('topics').findOneAsync({ '_id': topicId }).then(manageTopicStateAsync);
   
   if(_.isNull(topic)) {
      return utils.sendAlert(404, 'danger', 'TOPIC_NOT_FOUND');
   } else {
      const topicExt = await appendTopicInfoAsync(topic, userId, true);
      res.json(topicExt);
   }
};

exports.create = async function(req, res) {
   // Topic name is the only necessary request letiable
   const data = req.body;
   const userId = ObjectId(req.user._id);
   const topic = {name: data.name};

   // reject empty topic names
   if(_.isEmpty(topic.name)) {
      return utils.sendAlert(res, 400, 'danger', 'TOPIC_NAME_EMPTY');
   }
   
   // Only allow new topics if they do not exist yet
   const count = await db.collection('topics').countAsync({'name': topic.name});
   
   // Topic already exists
   if(count > 0) {
      return utils.sendAlert(409, 'danger', 'TOPIC_NAME_ALREADY_EXISTS');
   }
      
   // Create topic
   topic._id = ObjectId();
   topic.owner = ObjectId(req.user._id);
   topic.stage = C.STAGE_SELECTION; // start in selection stage
   topic.level = 0;
   topic.nextDeadline = calculateDeadline(topic.stage);
   await db.collection('topics').insertAsync(topic);
   
   // Create description
   /*let dpid = ObjectId(); // Create random pad id
   let description = { 'pid': dpid, 'tid': topic._id };
   let createTopicDescriptionPromise = db.collection('topic_descriptions').insertAsync(description);*/
   
   // Create pad
   const pad = { 'topicId': topic._id, 'ownerId': userId, 'expiration': topic.nextDeadline };
   await pads.createPadAsync(pad, 'topic_description');
   
   topic.votes = 0;
   
   return res.json(topic);
};

exports.delete = async function(req,res) {
    const topicId = ObjectId(req.params.id);
    const uid = ObjectId(req.user._id);
    
    const topic = await db.collection('topics').findOneAsync({ '_id': topicId }, { 'owner': true, 'stage': true });
    // only the owner can delete the topic
    // and if the selection stage has passed, nobody can
    if(!_.isEqual(topic.owner,uid) || topic.stage > C.STAGE_SELECTION) {
        return utils.sendAlert(401, 'danger', 'TOPIC_NOT_AUTHORISIZED_FOR_DELETION');
    }
    
    await Promise.join(
	    db.collection('topics').removeByIdAsync(topicId),
	    db.collection('topic_votes').removeAsync({'topicId': topicId}),
	    db.collection('groups').removeAsync({'tid': topicId})
    );
    
    res.sendStatus(200);
};

function countVotes(topicId) {
    return db.collection('topic_votes').countAsync( {'topicId': topicId} );
}

/*
 * @desc: User votes for specific topic
 */
exports.vote = async function(req, res) {
	// Transmitted topic vote
	const topic_vote = {
		'topicId': ObjectId(req.body.topicId),
		'userId': ObjectId(req.body.userId)
	};
	
	// Update the particular topic vote
	// If it already exists: Just update to the same (= do nothing)
	// If it does'nt exist: Insert
	await db.collection('topic_votes').updateAsync(topic_vote, topic_vote, {'upsert': true});

	res.json({ 'voted': true });
};

/*
 * @desc: User unvotes for specific topic
 */
exports.unvote = async function(req, res) {
	// Trasmitted topic vote
	const topic_vote = {
		'topicId': ObjectId(req.body.topicId),
		'userId': ObjectId(req.body.userId)
	};
    
	// Remove vote from database
	await db.collection('topic_votes').removeAsync(topic_vote);
	
	res.json({'voted': false});
};

/*
 * @desc: Download finished topic document
 */
exports.download = function(req, res) {
	const topicId = req.params.id;
	const filename = path.join(appRoot.path, 'files/documents', topicId+'.pdf');
	//res.sendFile(filename);
	res.download(filename);
};
