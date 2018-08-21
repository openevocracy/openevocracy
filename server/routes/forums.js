// General libraries
var _ = require('underscore');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');

exports.query = function(req, res) {
	var forumId = ObjectId(req.params.id);
	var userId = ObjectId(req.user._id);
	
	console.log('forum query');
	
	// Query forumId in forum collection, if not exists, create a forum
	//var forum = { '_id': forumId, 'groupId': ..., ... }
	
};
