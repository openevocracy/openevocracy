var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

var C = require('setup/constants.json');
var utils = require('../utils');
var pads = require('../pads');

exports.create = function(req, res) {
    var tid = ObjectId(req.params.id);
    var uid = ObjectId(req.signedCookies.uid);
    
    db.collection('topics').findOneAsync({ '_id': tid }).then(function(topic) {
        // Check if topic is at least in proposal stage to show proposal
        if(topic.stage < C.STAGE_PROPOSAL)
            return utils.rejectPromiseWithAlert(400, 'danger', 'TOPIC_REQUIREMENT_PROPOSAL_STAGE');
        return topic;
    }).then(function(topic) {
        // Get proposal or create proposal if it does not exist
        // From http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
        var create_proposal_promise =
        db.collection('proposals').findAndModifyAsync(
            { 'tid':tid, 'source':uid },[],
            { $setOnInsert: {pid: ObjectId()}},
            { new: true, upsert: true }).get('value');
        
        return Promise.join(topic, create_proposal_promise);
    }).spread(function(topic, proposal) {
        return pads.createPadIfNotExistsAsync(proposal.pid, topic.nextDeadline).
        then(function() {
            proposal.body = pads.getPadHTMLAsync(proposal.pid);
            proposal.expired = false;
            
            return Promise.props(proposal);
        });
    }).then(_.bind(res.json,res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};

exports.query = function(req, res) {
    var ppid = ObjectId(req.params.id);
    
    return db.collection('proposals').findOneAsync({ '_id': ppid })
    .then(function(proposal) {
        return pads.getPadWithBodyAsync(proposal.pid).then(function(pad) {
            // Extend proposal object with html body of pad and expired status
            proposal.body = pad.body;
            proposal.expired = pad.isExpired();
            
            // Delete pid from proposal object if we are not in proposal stage
            if(proposal.expired) {
                delete proposal.pid;
                
                // flash message in client that proposal not editable
                proposal.alert = {type: 'info', content: 'PROPOSAL_QUERIED_NOT_IN_PROPOSAL_STAGE'};
            }
            
            return proposal;
        });
    }).then(_.bind(res.json,res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};
