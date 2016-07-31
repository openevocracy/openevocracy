var _ = require('underscore');
var requirejs = require('requirejs');
var gulf = require('gulf');
var mongoose = require('mongoose');
var MongoDBAdapter = require('gulf-mongodb');
var richText = require('rich-text');
var ottype = richText.type;
var Delta = richText.Delta;
var dom = require('jsdom');
var pdf = require('phantom-html2pdf');
var ObjectId = require('mongodb').ObjectID;
var db = require('./database').db;
var $ = require('jquery');

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

var envAsync = Promise.promisify(dom.env);
var pdfConvertAsync = Promise.promisify(pdf.convert);

// all pads will be initialized with this
// TODO bring this text to config file
var starttext = {"ops":[{"insert": "Hello World!"}]};

// masterDoc -> slaveLink <-> masterLink <- slaveDoc <-> quill
function gulfIO(masterDoc, slaveSocket) {
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

/*var adapter = new gulf.MemoryAdapter();
var padIdToDocMap = {};
function getPadDocAsync(pid) {
  // check if document is in map first
  var doc = padIdToDocMap[pid];
  if(!_.isUndefined(doc))
    return Promise.resolve(doc);
  
  return gulf.Document.createAsync(adapter, ottype, starttext).
  then(function(doc) {
    padIdToDocMap[pid] = doc;
    return Promise.resolve(doc);
  });
}*/

var dbConnection = mongoose.createConnection('mongodb://'+process.env.IP+'/mindabout');
var adapter = new MongoDBAdapter(dbConnection);
var padIdToDocMap = {};
function getPadDocAsync(pid) {
  // check if document is in map first
  var doc = padIdToDocMap[pid];
  if(!_.isUndefined(doc))
    return Promise.resolve(doc);
  
  // if not in map, load or create document
  return db.collection('pads').findOneAsync({'_id': pid},{'did': true}).
  then(function(pad) {
    // load or create gulf document
    if(_.isNull(pad))
      return gulf.Document.createAsync(adapter, ottype, starttext).
        then(function(doc) {
          // if newly created, save in database
          return db.collection('pads').insertAsync(
            {'_id': pid,'did': doc.id}).return(doc);
        });
    else
      return gulf.Document.loadAsync(adapter, ottype, pad.did);
  }).then(function(doc) {
    padIdToDocMap[pid] = doc;
    return Promise.resolve(doc);
  });
}

exports.startPadServer = function(httpServer) {
  var io = require('socket.io')(httpServer, {secure: true});
  io.on('connection', function(slaveSocket) {
    slaveSocket.on('identity', function(identity) {
      getPadDocAsync(ObjectId(identity.pid)).then(function(masterDoc) {
        gulfIO(masterDoc, slaveSocket);
      });
    });
  });
};

function getDocHTMLAsync(doc) {
  return envAsync('<div id="editor"></div>').then(function (window) {
      document = window.document;
      navigator = window.navigator;
      document.getSelection = function() {return null};
      
      var Quill = require('quill');
      var editor = new Quill("#editor");
      console.log(doc.content);
      editor.updateContents(doc.content);
      
      return editor.getHTML();
  });
}

var getPadHTMLAsync = function(pid) {
  return getPadDocAsync(pid).then(getDocHTMLAsync);
};
exports.getPadHTMLAsync = getPadHTMLAsync;

exports.getPadPDFAsync = function(pid) {
    return getPadHTMLAsync(pid).then(function (html) {
        return pdfConvertAsync({'html': html});
    }).then(function (result) {
      // this is required to convert the callback into a format
      // suitable for promises, e.g. error is first parameter
      function toBufferWrapper(callback) {
        function callbackWrapper(buffer) {
          return callback(undefined, buffer);
        }
        result.toBuffer(callbackWrapper);
      }
      
      var toBufferAsync = Promise.promisify(toBufferWrapper);
      return toBufferAsync();
    });
};