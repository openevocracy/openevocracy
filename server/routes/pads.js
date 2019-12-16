// General libraries
const _ = require('underscore');
const Promise = require('bluebird');
const ObjectId = require('mongodb').ObjectID;
const pdf = require('phantom-html2pdf');

// Collaborative libraries for pad synchronization
const ShareDB = require('sharedb');
const richText = require('rich-text');
const WebSocketJSONStream = require('websocket-json-stream');
const ShareDBAccess = require('sharedb-access');
const sharedb = require('../database').sharedb;
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

// Own references
const db = require('../database').db;
const utils = require('../utils');
const groups = require('./groups');
const users = require('./users');

// ShareDB backend and connection
let backend;
let connection;

// Pads cache
let pads_topic_description = {};
let pads_proposal = {};
let pads_group = {};

/*
 * @desc: Create shareDB connection and define socket events
 * @params: wss: the ws socket
 */
exports.startPadServer = function(wss) {
	// Register richt text type
	ShareDB.types.register(richText.type);
	
	// Create shareDB backend with mongo adapter
	backend = new ShareDB({
		'db': sharedb,
		// The following options serve only to squelch errors.
		// It should be possible to remove these when ShareDB 1.0 is released.
		 disableDocAction: true,
		 disableSpaceDelimitedActions: true
	});
	
	// Register ShareDBAccess middleware
	ShareDBAccess(backend);
	
	// Initialize stream and listener for WebSocket server
	wss.on('connection', function(ws, req) {
		const userToken = req.url.split("/socket/pad/")[1];
		// Authenticate user and initialize sharedb afterwards
		users.socketAuthentication(ws, userToken, function(userId) {
			// If salt is correct, create stream, let backend listen to stream and hand over userId for middleware
			const stream = new WebSocketJSONStream(ws);
			backend.listen(stream, {'userId': userId});
			
			// Add userId to ws connection
			ws.userId = userId;
		});
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
	var isOwner = (session.userId.toString() == pad.ownerId.toString());
	var isExpired = (pad.expiration <= Date.now());
	return isOwner && !isExpired;
}

/*
 * @desc: Similar to checkOwnerAndExpiration, but specific member of group has to be found
 * @params:
 *    session: contains the userId of the current user
 *    pad: contains meta information about the pad (i.e. group members and expiration date)
 */
function checkOwnerAndExpirationGroup(session, pad) {
	var isOwner = utils.containsObjectId(pad.ownerIds, session.userId);
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
		if (pads_topic_description[docId]) {
			// If pad is already in cache, check condition
			return checkOwnerAndExpiration(session, pads_topic_description[docId]);
		} else {
			// If pad is not in cache, get it from database, store it in cache and check condition
			return Promise.resolve(db.collection('pads_topic_description').findOneAsync({'docId': ObjectId(docId)}, { 'ownerId': true, 'expiration': true })
				.then(function(pad) {
					pads_topic_description[docId] = pad;
					return checkOwnerAndExpiration(session, pad);
			}));
		}
	});
	
	// Proposal pad
	backend.allowRead('docs_proposal', function(docId, doc, session) {
		return true;
	});
	backend.allowUpdate('docs_proposal', function(docId, oldDoc, newDoc, ops, session) {
		// If user is owner and document is not expired
		if (pads_proposal[docId]) {
			// If pad is already in cache, check condition
			return checkOwnerAndExpiration(session, pads_proposal[docId]);
		} else {
			// If pad is not in cache, get it from database, store it in cache and check condition
			return Promise.resolve(db.collection('pads_proposal').findOneAsync({'docId': ObjectId(docId)}, { 'ownerId': true, 'expiration': true })
				.then(function(pad) {
					pads_proposal[docId] = pad;
					return checkOwnerAndExpiration(session, pad);
			}));
		}
	});
	
	// Group pad
	backend.allowRead('docs_group', function(docId, doc, session) {
		return true;
	});
	backend.allowUpdate('docs_group', function(docId, oldDoc, newDoc, ops, session) {
		let currentPad_promise;
		// If user is member of group and document is not expired
		if (pads_group[docId]) {
			// If pad is already in cache, just use it
			currentPad_promise = Promise.resolve(pads_group[docId]);
		} else {
			// If pad is not in cache, get it from database, store it in cache and use it
			currentPad_promise = db.collection('pads_group').findOneAsync({'docId': ObjectId(docId)}, { 'groupId': true, 'expiration': true })
				.then(function(pad) {
					const members_promise = db.collection('group_relations').find({'groupId': pad.groupId}, {'userId': true}).toArrayAsync();
					return Promise.join(pad, members_promise);
				}).spread(function(pad, members) {
					// Add owners to pad
					pad.ownerIds = _.pluck(members, 'userId');
					// Store pad in cache
					pads_group[docId] = pad;
					// Return pad
					return pad;
			});
		}
		
		return currentPad_promise.then((currentPad) => {
			// Check if user is owner and doc is not expired, finally return
			if (checkOwnerAndExpirationGroup(session, currentPad)) {
				// Inform group toolbar badge about update
				groups.badges.updateEditorBadge(session.userId, currentPad);
				// Return true and allow update
				return true;
			}
			
			return false;
		});
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
	
	// Create doc and add meta information afterwards (in callback)
	return new Promise( (resolve, reject) => {
		doc.create([], richText.type.name, function(err) {
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
		return db.collection('topics').findOneAsync({'_id': pad.topicId}, { 'name': true });
	});
	
	// Return pad meta information including topic name
	return Promise.join(pad_promise, topic_name_promise).spread(function(pad, topic) {
		return { 'docId': pad.docId, 'title': topic.name, 'topicId': pad.topicId, 'deadline': pad.expiration };
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
 * @desc: Query information about proposal or group for simple view
 */
function queryViewAsync(collection_suffix, padId) {
	return db.collection('pads_'+collection_suffix).findOneAsync({ '_id': padId }).then(function(pad) {
		// Get pad html
		var html_promise = getPadHTMLAsync(collection_suffix, pad.docId);
		// Get topic name
		var topicName_promise = db.collection('topics').findOneAsync({'_id': pad.topicId}).get('name');
		
		// Join all information and return
		return Promise.join(html_promise, topicName_promise).spread(function(html, topicName) {
			var ownerId = (collection_suffix == 'proposal') ? pad.ownerId : null;
			return { 'topicId': pad.topicId, 'title': topicName, 'html': html, 'expiration': pad.expiration, 'ownerId': ownerId };
		});
	});
}

/*
 * @desc: Query information about proposal for simple view
 */
exports.getPadProposalView = function(req, res) {
	var padId = ObjectId(req.params.id);
	queryViewAsync('proposal', padId).then(res.json.bind(res));
};

/*
 * @desc: Query information about group for simple view
 */
exports.getPadGroupView = function(req, res) {
	var padId = ObjectId(req.params.id);
	queryViewAsync('group', padId).then(res.json.bind(res));
};

/*
 * @desc:
 *    Get assembled html from pad as promise
 * @params:
 *    collection: collection to store pad in
 *    docId: id of the particular doc
 */
function getPadHTMLAsync(collection_suffix, docId) {
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
exports.getPadHTMLAsync = getPadHTMLAsync;

/*
 * @desc:
 *    Create pdf file from pad html
 * @params:
 *    html: html of the pad
 */
exports.getPadPDFAsync = function(html) {
	console.log('getPadPDFAsync', html);
	var pdfConvertAsync = Promise.promisify(pdf.convert);
	
	return pdfConvertAsync({'html': html})
		.then(function(result) {
		// This is required to convert the callback into a format
		// suitable for promises, e.g. error is first parameter
		function toBufferWrapper(bluebirdCallback) {
		   result.toBuffer(_.partial(bluebirdCallback,undefined));
		}
		
		var toBufferAsync = Promise.promisify(toBufferWrapper);
		return toBufferAsync();
	});
};

/**
 * @desc: 
 */
exports.addHtmlToPadAsync = function(collection_suffix, pad) {
	return getPadHTMLAsync(collection_suffix, pad.docId).then(function(html) {
		return _.extend(pad, {'html': html});
	});
}
