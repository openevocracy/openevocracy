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
        // check if topic is at least in proposal stage
        if(topic.stage < C.STAGE_PROPOSAL)
            return utils.rejectPromiseWithNotification(400, "Topic must be at least in proposal stage.");
        return topic;
    }).then(function(topic) {
        // get proposal or create proposal if it does not exist
        // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
        var get_proposal_promise =
        db.collection('proposals').findAndModifyAsync(
            { 'tid':tid, 'source':uid },[],
            { $setOnInsert: {pid: ObjectId()}},
            { new: true, upsert: true }).get('value');
        
        return Promise.join(topic, get_proposal_promise);
    }).spread(function(topic, proposal) {
        // create pad if not exists
        var create_pad_promise = pads.createPadIfNotExistsAsync(proposal.pid, topic.nextDeadline);
        
        // get pad_body
        var get_pad_html_promise = create_pad_promise.then(function() {
            return pads.getPadHTMLAsync(proposal.pid);
        });
        // pad can only be edited in proposal stage
        if(topic.stage != C.STAGE_PROPOSAL)
            delete proposal.pid;
        
        // append pad body
        return Promise.props(_.extend(proposal,{'body': get_pad_html_promise}));
    }).then(_.bind(res.json,res))
      .catch(utils.isOwnError,utils.handleOwnError(res));
};
