var _ = require('underscore');
var Promise = require('bluebird');
var ObjectId = require('mongodb').ObjectID;
var ShareDB = require('sharedb');
var richText = require('rich-text');
var WebSocketJSONStream = require('websocket-json-stream');
var db = require('../database').db;
var ShareDBMongo = require('sharedb-mongo');
var ShareDBAccess = require('sharedb-access');

ShareDB.types.register(richText.type);
var sharedb = ShareDBMongo('mongodb://127.0.0.1/evocracy');

var backend;


exports.startPadServer = function(wss) {
	// Create shareDB backend with mongo adapter
	backend = new ShareDB({ 'db': sharedb });
	
	// Register ShareDBAccess middleware
	ShareDBAccess(backend);
	
	// Initialize stream and listener for WebSocket server
	wss.on('connection', function(ws, req) {
		// Get uid from client request
		var uid = req.url.split("?uid=")[1];
		
		// Create stream
		var stream = new WebSocketJSONStream(ws);
		
		// Let backend listen to stream, also hand over uid for middleware
		backend.listen(stream, { 'uid': uid });
	});
	
	backend.use('connect', (request, next) => {
		// Get uid from backend and store it,
		// such that it can be used in sharedb-access middleware session
		if (!_.isUndefined(request.req))
			request.agent.connectSession = { 'uid': request.req.uid };
		
		// Callback
		next();
	});
	
	// Use middleware sharedb-access to restrict reading permission
	backend.allowRead('docs', function(docId, doc, session) {
		return true;
	});
	
	// Use middleware sharedb-access to restrict writing permission
	backend.allowUpdate('docs', function(docId, oldDoc, newDoc, ops, session) {
		console.log('allowUpdate');
		// Proposal/Description: If user is owner and document is not expired
		// Group: If user is member and document is not expired
		console.log(oldDoc);
		console.log(session.uid);
		return true;
	});
};

function createPadAsync(pad) {
	var connection = backend.connect();
	
	var did = ObjectId();
	var doc = connection.get('docs', did);
	
	doc.fetch(function(err) {
		if (err) throw err;
		if (doc.type === null) {
			doc.create([{insert: 'Hi!'}], richText.type.name);
			doc.data = {'meta': "123"};
			return;
		}
		return;
	});
	
	return db.collection('pads').insertAsync(_.extend(pad, {'did': did})).return(pad);
}

exports.createPadAsync = createPadAsync; 

/*
 * @desc: Gets more information for some pad
 *        xpid can be ppid or dpid
 */
function getPadDetails(xpid, collection) {
	// Get description, propsal, etc.
	var topic_x_promise = db.collection(collection).findOneAsync({ '_id': xpid });
	// Get topic details
	var topic_promise = topic_x_promise.then(function(obj) {
		return db.collection('topics').findOneAsync({ '_id': obj.tid }, { 'name': true });
	});
	// Get document id
	var pad_promise = topic_x_promise.then(function(obj) {
		return db.collection('pads').findOneAsync({ '_id': obj.pid }, { 'did': true });
	});
	
	// Join and return necessary information
	return Promise.join(topic_x_promise, topic_promise, pad_promise).spread(function(topic_x, topic, pad) {
		return { 'title': topic.name, 'source': topic._id, 'pid': topic_x.pid, 'did': pad.did };
	});
}

// @desc: Gets more information for topic description pad
exports.getPadTopicDetails = function(req, res) {
	var dpid = ObjectId(req.params.id);
	var collection = 'topic_descriptions';
	
	getPadDetails(dpid, collection).then(res.send.bind(res));
};

// @desc: Gets more information for proposal pad
exports.getPadProposalDetails = function(req, res) {
	var ppid = ObjectId(req.params.id);
	var collection = 'topic_proposals';
	
	getPadDetails(ppid, collection).then(res.send.bind(res));
};
