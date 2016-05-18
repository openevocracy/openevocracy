var _ = require('underscore');
var gulf = require('gulf');
var mongoose = require('mongoose');
var MongoDBAdapter = require('gulf-mongodb');
var richText = require('rich-text');
var ottype = richText.type;
var Delta = richText.Delta;

// promisify gulf
var Promise = require('bluebird');
Object.keys(gulf).forEach(function(key) {
  var value = gulf[key];
  if (typeof value === "function") {
    Promise.promisifyAll(value);
    Promise.promisifyAll(value.prototype);
  }
});
Promise.promisifyAll(gulf);

// all pads will be initialized with this
var starttext = 'Hello World!';

// masterDoc -> slaveLink <-> masterLink <- slaveDoc <-> quill
function gulfIO(masterDoc, slaveSocket) {
  slaveSocket.emit('setContents',starttext);
  
  // create slaveDoc and slaveToMasterLink
  var slaveDoc = new gulf.EditableDocument(new gulf.MemoryAdapter, ottype);
  var slaveToMasterLink = slaveDoc.masterLink();
  
  // masterDoc -> slaveLink <-> masterLink <- slaveDoc
  {
    var masterToSlaveLink = masterDoc.slaveLink();
    slaveToMasterLink.pipe(masterToSlaveLink);
    masterToSlaveLink.pipe(slaveToMasterLink);
  }
  
  // quill -> slaveDoc
  {
    slaveSocket.on('change', function (slaveToMasterChange) {
      if(_.isEmpty(slaveToMasterChange.ops))
        return;
      
      console.log('slaveToMasterChange', slaveToMasterChange);
      slaveDoc.update(new Delta(slaveToMasterChange));
    });
  }
  
  // slaveDoc -> quill
  slaveDoc._setContents = function(contents, cb) {
    console.log('setContents', JSON.stringify(contents));
    slaveSocket.emit('setContents',contents);
    
    cb();
  };
  slaveDoc._change = function(masterToSlaveChange, cb) {
    console.log('masterToSlaveChange', JSON.stringify(masterToSlaveChange));
    slaveSocket.emit('change',masterToSlaveChange);
    
    cb();
  };
  slaveDoc._collectChanges = function(cb) { cb(); }
  
  slaveSocket.on('disconnect', function () {
    console.log('disconnect');
    // remove link from master doc
    masterDoc.links.splice(masterDoc.links.indexOf(slaveToMasterLink),1);
  });
}

var dbConnection = mongoose.createConnection('mongodb://'+process.env.IP+'/mindabout');
var adapter = new MongoDBAdapter(dbConnection);
//var adapter = new gulf.MemoryAdapter();
function getDocAsync(docId) {
  // load or create gulf document
  if(_.isUndefined(docId))
    return gulf.Document.createAsync(adapter, ottype, starttext);
  else
    return gulf.Document.loadAsync(adapter, ottype, docId);
}

var padIdToDocMap = {};
var padIdToDocIdMap = {}; // TODO must be saved in database
function getPadAsync(padId) {
  // check if document is in map first
  var doc = padIdToDocMap[padId];
  if(!_.isUndefined(doc))
    return Promise.resolve(doc);
  
  // if not in map, load or create document
  var docId = padIdToDocIdMap[padId];
  return getDocAsync(docId).then(function(doc) {
    padIdToDocMap[padId] = doc;
    padIdToDocIdMap[padId] = doc.id;
    
    return doc;
  });
}

exports.startPadServer = function(httpServer) {
  var io = require('socket.io')(httpServer, {secure: true});
  io.on('connection', function (slaveSocket) {
    slaveSocket.on('identity', function(identity) {
      getPadAsync(identity.pid).then(function (masterDoc) {
        gulfIO(masterDoc, slaveSocket);
      });
    });
  });
};