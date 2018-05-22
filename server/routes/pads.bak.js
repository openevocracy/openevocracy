var _ = require('underscore');
var Promise = require('bluebird');
var gulf = require('gulf');
//var MongoDBAdapter = require('gulf-mongodb');
var MongoskinAdapter = require('gulf-mongoskin');
var richText = require('rich-text');
var ottype = richText.type;
var Delta = richText.Delta;
var QuillDeltaToHtmlConverter = require('quill-delta-to-html');
var pdf = require('phantom-html2pdf');
var ObjectId = require('mongodb').ObjectID;

var C = require('../../shared/constants').C;

var db = require('../database').db;
var utils = require('../utils');
var promisify = require('../promisify');

// promisify gulf
var gulf = promisify(gulf);

var pdfConvertAsync = Promise.promisify(pdf.convert);

// all pads will be initialized with this
var starttext = {
	"ops": [ { "insert": "\n" } ]
};

// masterDoc -> slaveLink <-> masterLink <- slaveDoc <-> quill
function gulfIO(masterDoc, slaveSocket) {
	// create slaveDoc and slaveToMasterLink
	var slaveDoc = new gulf.EditableDocument({
		storageAdapter: new gulf.MemoryAdapter(),
		ottype: ottype
	});
	slaveDoc.initializeFromStorage();

	var slaveToMasterLink = slaveDoc.masterLink();

	// masterDoc -> slaveLink <-> masterLink <- slaveDoc
	{
		var masterToSlaveLink = masterDoc.slaveLink();
		slaveToMasterLink.pipe(masterToSlaveLink);
		masterToSlaveLink.pipe(slaveToMasterLink);
	}

	// quill -> slaveDoc
	{
		slaveSocket.on('change', function(slaveToMasterChange) {
			console.log('socket on change');
			
			if (_.isEmpty(slaveToMasterChange.ops))
				return;
			
			// prevent writing after expiration
			var pad = docIdToPadMap[masterDoc.id];
			if(!_.isUndefined(pad.expiration) && Date.now() > pad.expiration)
				return;
			
			// TODO implement user rights management
			// who can write, etc...
			
			console.log('slaveToMasterChange', slaveToMasterChange);
			//slaveDoc.update(new Delta(slaveToMasterChange));
			slaveDoc.submitChange(slaveToMasterChange);
			//slaveDoc.submitChange(new Delta(slaveToMasterChange));
			
			// Tell the client that all changes are stored
			slaveSocket.emit('submitted', true);
		});
	}

	// slaveDoc -> quill
	slaveDoc._setContent = function(contents) {
		console.log('setContents', JSON.stringify(contents));
		
		slaveSocket.emit('setContents', contents);
		return Promise.resolve();
	};
	
	slaveDoc._onChange = function(masterToSlaveChange) {
		console.log('masterToSlaveChange', JSON.stringify(masterToSlaveChange));
		slaveSocket.emit('change', masterToSlaveChange);
		return Promise.resolve();
	};
	
	slaveDoc._onBeforeChange = function() {
		return Promise.resolve();
	};
	
	slaveSocket.on('disconnect', function() {
		console.log('disconnect');
		
		// Update document html in pad
		var pad = docIdToPadMap[masterDoc.id];
		var html = getDocHTMLAsync(masterDoc);
		
		db.collection('pads')
			.updateAsync({ '_id': pad._id }, { $set: { 'html': html }})
			.then(function() {
				
				// Detach link and close slave doc
				masterDoc.detachLink(masterToSlaveLink);
				slaveDoc.close();
			});
	});
}

var padIdToDocMap = {};
var docIdToPadMap = {};

function createPadAsync(pad) {
	// Initalize MongoskinAdapter with db and document id
	var did = ObjectId();
	var adapter = new MongoskinAdapter(db, did);
	var masterDoc = new gulf.Document({
		storageAdapter: adapter,
		ottype: ottype
	});
	masterDoc.id = did;
	
	return masterDoc.initializeFromStorage(starttext).then(function() {
		// Set values to maps (cache)
		padIdToDocMap[pad.pid] = masterDoc; // TODO Reset
		docIdToPadMap[did] = pad;
		
		// Store pad object in pad collection (also extend pad with did)
		return db.collection('pads').insertAsync(_.extend(pad, {'did': did})).return(pad);
	});
}
exports.createPadAsync = createPadAsync; 

exports.createPadIfNotExistsAsync = function(pad) {
	// Check if getPadDocAsync throws error which indicates that pad does not exist
	return getPadAsync(pad._id).then(getPadDocAsync).catch(utils.isOwnError, function () {
		// If pad does not already exist, create it
		return createPadAsync(pad);
	});
};

exports.updatePadExpirationAsync = function(pid, expiration) {
	return db.collection('pads').updateAsync(
		{ '_id': pid }, { $set: { 'expiration': expiration }}
	);
};

function getPadAsync(pid) {
	return db.collection('pads').findOneAsync({ '_id': pid }).then(function(pad) {
		if (_.isNull(pad))
			return Promise.reject({reason: 'PAD_DOES_NOT_EXIST'});
		
		// append helper function
		pad.isExpired = function() {
			return !_.isUndefined(this.expiration) && Date.now() > this.expiration;
		}.bind(pad);
		
		return Promise.resolve(pad);
	});
}
exports.getPadAsync = getPadAsync;

function getPadWithBodyAsync(pid) {
	return getPadAsync(pid).then(function(pad) {
		pad.body = getPadDocAsync(pad).then(getDocHTMLAsync);
		return Promise.props(pad);
	});
}
exports.getPadWithBodyAsync = getPadWithBodyAsync;

function getPadDocAsync(pad) {
	// check if document is in map first
	var masterDoc = padIdToDocMap[pad._id];
	if (!_.isUndefined(masterDoc))
		return Promise.resolve(masterDoc);
	
	// if not in map, load or handle error
	var adapter = new MongoskinAdapter(db, pad.did);
	masterDoc = new gulf.Document({
		storageAdapter: adapter,
		ottype: ottype
	});
	masterDoc.id = pad.did;
	return masterDoc.initializeFromStorage().then(function() {
		padIdToDocMap[pad._id] = masterDoc; // Reset
		docIdToPadMap[masterDoc.id] = pad;
		return Promise.resolve(masterDoc);
	});
}

exports.startPadServer = function(io) {
	io.on('connection', function(socket) {
		socket.on('pad_identity', function(identity) {
			getPadAsync(ObjectId(identity.pid)).then(getPadDocAsync).then(function(masterDoc) {
				gulfIO(masterDoc, socket);
			});
		});
	});
};

function getDocHTMLAsync(doc) {
	var cfg = {};
	var converter = new QuillDeltaToHtmlConverter(doc.content.ops, cfg);
	var html = converter.convert();
	
	return html;
}

var getPadHTMLAsync = function(pid) {
	return getPadAsync(pid).then(getPadDocAsync).then(getDocHTMLAsync);
};
exports.getPadHTMLAsync = getPadHTMLAsync;

exports.getPadPDFAsync = function(pid) {
	return getPadHTMLAsync(pid).then(function(html) {
		return pdfConvertAsync({'html': html});
	}).then(function(result) {
		// this is required to convert the callback into a format
		// suitable for promises, e.g. error is first parameter
		function toBufferWrapper(bluebirdCallback) {
		   result.toBuffer(_.partial(bluebirdCallback,undefined));
		}
		
		var toBufferAsync = Promise.promisify(toBufferWrapper);
		return toBufferAsync();
	});
};

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
	
	// Join and return necessary information
	return Promise.join(topic_x_promise, topic_promise).spread(function(topic_x, topic) {
		return { 'title': topic.name, 'source': topic._id, 'pid': topic_x.pid };
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

// @desc: Gets more information for group pad
exports.getPadGroupDetails = function(req, res) {
	var gpid = ObjectId(req.params.id);
	var collection = 'topic_proposals';
	
	getPadDetails(gpid, collection).then(res.send.bind(res));
};

