var _ = require('underscore');
var $ = require('jquery');
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

var utils = require('./utils');

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
var starttext = {
    "ops": [{
        "insert": "Hello World!"
    }]
};

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
        slaveSocket.on('change', function(slaveToMasterChange) {
            if (_.isEmpty(slaveToMasterChange.ops))
                return;

            // prevent writing after expiration
            var pad = docIdToPadMap[masterDoc.id];
            if(!_.isUndefined(pad.expiration) && Date.now() > pad.expiration)
                return;
            
            // TODO implement user rights management
            // who can write, etc...
            
            console.log('slaveToMasterChange', slaveToMasterChange);
            slaveDoc.update(new Delta(slaveToMasterChange));
        });
    }

    // slaveDoc -> quill
    slaveDoc._setContents = function(contents, cb) {
        console.log('setContents', JSON.stringify(contents));
        slaveSocket.emit('setContents', contents);

        cb();
    };
    slaveDoc._change = function(masterToSlaveChange, cb) {
        console.log('masterToSlaveChange', JSON.stringify(masterToSlaveChange));
        slaveSocket.emit('change', masterToSlaveChange);

        cb();
    };
    slaveDoc._collectChanges = function(cb) {
        cb();
    }

    slaveSocket.on('disconnect', function() {
        console.log('disconnect');
        // remove link from master doc
        masterDoc.links.splice(masterDoc.links.indexOf(slaveToMasterLink), 1);
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

var dbConnection = mongoose.createConnection('mongodb://' + process.env.IP + '/mindabout');
var adapter = new MongoDBAdapter(dbConnection);
var padIdToDocMap = {};
var docIdToPadMap = {};

function createPadAsync(pid, expiration) {
    return gulf.Document.createAsync(adapter, ottype, starttext).then(function(doc) {
        // Create pad object
        var pad = {
            '_id': pid,
            'did': doc.id,
            'expiration': expiration
        };
        
        // Set values to maps (cache)
        padIdToDocMap[pid] = doc;
        docIdToPadMap[doc.id] = pad;
        
        // Store pad object in pad collection
        return db.collection('pads').insertAsync(pad);
    });
};
exports.createPadAsync = createPadAsync; 

exports.createPadIfNotExistsAsync = function(pid, expiration) {
    // Check if getPadDocAsync throws error which indicates that pad does not exist
    return getPadDocAsync(pid).catch(utils.isOwnError, function () {
        // If pad does not already exist, create it
        return createPadAsync(pid, expiration);
    });
};

exports.updatePadExpirationAsync = function(pid, expiration) {
    return db.collection('pads').updateAsync(
        { '_id': pid }, { $set: { 'expiration': expiration }}
    );
};

function getPadDocAsync(pid) {
    // check if document is in map first
    var doc = padIdToDocMap[pid];
    if (!_.isUndefined(doc))
        return Promise.resolve(doc);

    // if not in map, load or handle error
    return db.collection('pads').
        findOneAsync({ '_id': pid }).then(function(pad) {
            if (_.isNull(pad))
                return Promise.reject({reason: 'PAD_DOES_NOT_EXIST'});
            else {
                return gulf.Document.loadAsync(adapter, ottype, pad.did).then(function(doc) {
                    padIdToDocMap[pid] = doc;
                    docIdToPadMap[doc.id] = pad;
                    return Promise.resolve(doc);
                });
            }
        });
}

exports.startPadServer = function(httpServer) {
    var io = require('socket.io')(httpServer, {
        secure: true
    });
    io.on('connection', function(slaveSocket) {
        slaveSocket.on('identity', function(identity) {
            getPadDocAsync(ObjectId(identity.pid)).then(function(masterDoc) {
                gulfIO(masterDoc, slaveSocket);
            });
        });
    });
};

function getDocHTMLAsync(doc) {
    // from https://github.com/quilljs/quill/issues/993#issuecomment-249387907
    return envAsync('<div id="editor"></div>',
        ['https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/0.7.22/MutationObserver.js',
         'https://cdn.quilljs.com/1.1.5/quill.min.js']).
        then(function(window) {
            // fake getSelection
            // https://github.com/tmpvar/jsdom/issues/317
            var document = window.document;
            document.getSelection = function() { 
                return { 
                    getRangeAt: function() {}
                };
            }; 
            
            var editor = new window.Quill("#editor");
            editor.updateContents(doc.content);
    
            return document.querySelector(".ql-editor").innerHTML;
        });
}

var getPadHTMLAsync = function(pid) {
    return getPadDocAsync(pid).then(getDocHTMLAsync);
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
