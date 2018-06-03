// General libraries
var _ = require('underscore');
var Promise = require('bluebird');
var ObjectId = require('mongodb').ObjectID;
var db = require('../database').db;

// Collaborative libraries for pad synchronization
var ShareDB = require('sharedb');
var richText = require('rich-text');
var WebSocketJSONStream = require('websocket-json-stream');
var ShareDBMongo = require('sharedb-mongo');
var ShareDBAccess = require('sharedb-access');
var sharedb = ShareDBMongo('mongodb://127.0.0.1/evocracy');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html');

// ShareDB backend and connection
var backend;
var connection;

// Pads cache
var pads = {};

/*
 * @desc: Create shareDB connection and define socket events
 * @params: wss: the ws socket
 */
exports.startPadServer = function(wss) {
	// Register richt text type
	ShareDB.types.register(richText.type);
	
	// Create shareDB backend with mongo adapter
	backend = new ShareDB({ 'db': sharedb });
	
	// Register ShareDBAccess middleware
	ShareDBAccess(backend);
	
	// Initialize stream and listener for WebSocket server
	wss.on('connection', function(ws, req) {
		// Get userId from client request
		var userId = req.url.split("?userId=")[1];
		
		// TODO Check token!? 
		
		// Create stream
		var stream = new WebSocketJSONStream(ws);
		
		// Let backend listen to stream, also hand over userId for middleware
		backend.listen(stream, { 'userId': userId });
	});
	
	// Middleware to hook into connection process
	backend.use('connect', (request, next) => {
		// Get userId from backend such that it can be used in sharedb-access middleware session
		if (!_.isUndefined(request.req))
			request.agent.connectSession = request.req;
		// Callback
		next();
	});
	
	// Use middleware sharedb-access to define access
	initializeAccessControl();
	
	// Establish connection to shareDB
	connection = backend.connect();
};

/*
 * @desc: Checks if current user is owner of the pad and if pad is not already expired
 * @params:
 *    session: contains the userId of the current user
 *    pad: contains meta information about the pad (i.e. owner and expiration date)
 */
function checkOwnerAndExpiration(session, pad) {
	var isOwner = (session.userId == pad.ownerId);
	var isExpired = (pad.expiration <= Date.now());
	return isOwner && !isExpired;
}

/*
 * @desc: Initalize shareDB access control for the pads
 */
function initializeAccessControl() {
	// Note: allowUpdate is called for every delta
	
	// Topic description pad
	backend.allowRead('docs_topic_description', function(docId, doc, session) {
		return true;
	});
	backend.allowUpdate('docs_topic_description', function(docId, oldDoc, newDoc, ops, session) {
		// If user is owner and document is not expired
		if (pads[docId]) {
			// If pad is already in cache, check condition
			return checkOwnerAndExpiration(session, pads[docId]);
		} else {
			// If pad is not in cache, get it from databse, store it in cache and check condition
			return Promise.resolve(db.collection('pads_topic_description').findOneAsync({'docId': ObjectId(docId)}, { 'ownerId': true, 'expiration': true })
				.then(function(pad) {
					pads[docId] = pad;
					return checkOwnerAndExpiration(session, pad);
			}));
		}
	});
	
	// Proposal pad
	backend.allowRead('docs_proposal', function(docId, doc, session) {
		return true;
	});
	backend.allowUpdate('docs_proposal', function(docId, oldDoc, newDoc, ops, session) {
		console.log('allowUpdate docs_proposal');
		// If user is owner and document is not expired
		
		// TODO
		
		console.log(session.userId);
		return true;
	});
	
	// Group pad
	backend.allowRead('docs_group', function(docId, doc, session) {
		return true;
	});
	backend.allowUpdate('docs_group', function(docId, oldDoc, newDoc, ops, session) {
		console.log('allowUpdate docs_group');
		// If user is member and document is not expired
		
		// TODO
		
		console.log(oldDoc);
		console.log(session.userId);
		return true;
	});
}

/*
 * @desc:
 *    Creates new shareDB document in chosen collection and adds some meta information
 * @params:
 *    pad: meta information of the particular pad
 *    collection: suffix of collection to store pad in
 */
function createPadAsync(pad, collection_suffix) {
	// Create new pad id and get define doc
	var docId = ObjectId();
	var doc = connection.get('docs_' + collection_suffix, docId);
	doc.ownerId = 'test';
	
	// Create doc and add meta information afterwards (in callback)
	return new Promise( (resolve, reject) => {
		doc.create([{insert: 'Hi!'}], richText.type.name, function(err) {
			if (err) reject(err);
			// After doc was created, add meta information in pads collection
			
			// FIXME why is _id of document stored as string in mongo?
			db.collection('pads_' + collection_suffix).insertAsync(_.extend(pad, { 'docId': docId }))
			.then(function(pad) {
				// Return pad
				resolve(pad);
			});
		});
	});
}

exports.createPadAsync = createPadAsync; 

/*
 * @desc: Gets more information for some pad
 * @params:
 *    collection: pad meta collection
 *    padId: pad id of specific pad
 */
function getPadDetails(collection, padId) {
	// Get pad meta information
	var pad_promise = db.collection(collection).findOneAsync({ '_id': padId });
	
	// Get topic id as source (for "back" button) and topic name
	var topic_name_promise = pad_promise.then(function(pad) {
		return db.collection('topics').findOneAsync({'_id': pad.topicId}, {'name': true}).get('name');
	});
	
	// Return pad meta information including topic name
	return Promise.join(pad_promise, topic_name_promise).spread(function(pad, topic_name) {
		return { 'docId': pad.docId, 'title': topic_name, 'source': pad.topicId };
	});
}

/*
 * @desc: Gets more information for topic description pad
 */
exports.getPadTopicDetails = function(req, res) {
	var padId = ObjectId(req.params.id);
	var collection = 'pads_topic_description';
	
	getPadDetails(collection, padId).then(res.send.bind(res));
};

/*
 * @desc: Gets more information for proposal pad
 */
exports.getPadProposalDetails = function(req, res) {
	var padId = ObjectId(req.params.id);
	var collection = 'pads_proposal';
	
	getPadDetails(collection, padId).then(res.send.bind(res));
};

/*
 * @desc:
 *    Get assembled html from pad as promise
 * @params:
 *    collection: collection to store pad in
 *    docId: id of the particular doc
 */
exports.getPadHTMLAsync = function(collection_suffix, docId) {
	// TODO: Do not call this function anytime when opening a topic. Instead, if connection is disconnected, store html in pad meta. Always just read html meta data from pad to show contents in topic.
	
	// Connect to the particular pad
	var doc = connection.get('docs_'+collection_suffix, docId);
	
	// Fetch document as promise and assemble html
	return new Promise( (resolve, reject) => {
		doc.fetch(function(err) {
			if (err) reject(err);
			
			// Use quill delta converter to get html from deltas
			var cfg = {};
			var converter = new QuillDeltaToHtmlConverter(doc.data.ops, cfg);
			var html = converter.convert();
			resolve(html);
		});
	});
};
