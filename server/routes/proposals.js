var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');

var C = requirejs('public/js/setup/constants');
var utils = require('../utils');
var pads = require('../pads');

exports.query = function(req, res) {
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
        var get_proposal_promise =
        db.collection('proposals').findAndModifyAsync(
            { 'tid':tid, 'source':uid },[],
            { $setOnInsert: {pid: ObjectId()}},
            { new: true, upsert: true }).get('value');
        
        return Promise.join(topic, get_proposal_promise);
    }).spread(function(topic, proposal) {
        // Create a pad if pad does not already exist
        return pads.createPadIfNotExistsAsync(proposal.pid, topic.nextDeadline).
        then(function() {
            // Get body of pad as html
            return pads.getPadHTMLAsync(proposal.pid);
        }).then(function(body) {
            // Extend proposal object with html body of pad and expired status
            proposal.body = body;
            proposal.expired = (topic.stage != C.STAGE_PROPOSAL);
            
            // Delete pid from proposal object if we are not in proposal stage
            if(topic.stage != C.STAGE_PROPOSAL) {
                delete proposal.pid;
                
                // flash message in client that proposal not editable
                proposal.alert = {type: 'info', content: 'PROPOSAL_QUERIED_NOT_IN_PROPOSAL_STAGE'};
            }
            
            return proposal;
        });
    }).then(_.bind(res.json,res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};
