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
var db = require('./database').db;

var utils = require('./utils');
var promisify = require('./promisify');

// promisify gulf
var gulf = promisify(gulf);

var pdfConvertAsync = Promise.promisify(pdf.convert);

// all pads will be initialized with this
// TODO allow individual starttext for every type of pad
// TODO think about language handling
var starttext = {
    "ops": [
            {
                "insert": "(See English translation below.)\n\n"
            },
            {
                "insert": "Übersicht"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "Eine kurze Zusammenfassung ...\n\n"
            },
            {
                "insert": "Beschreibung"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "Eine ausführliche Beschreibung ...\n\n"
            },
            {
                "insert": "Diskussion"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "Unbehandelte und kritische Aspekte ...\n\n"
            },
            {
                "insert": "(Hinweis: Dies ist nur eine Vorlage und muss nicht zwingend beachtet werden.)\n\n\n"
            },
            {
                "insert": "Abstract"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "A short summary ...\n\n"
            },
            {
                "insert": "Description"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "A more detailed description ...\n\n"
            },
            {
                "insert": "Discussion"
            },
            {
                "insert": "\n",
                "attributes": {
                    "header": 1
                }
            },
            {
                "insert": "Untreated and critical aspects ...\n\n"
            },
            {
                "insert": "(Note: This is just a template and may be ignored.)\n"
            }
        ]
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
        slaveDoc.close();
    });
}

var padIdToDocMap = {};
var docIdToPadMap = {};

function createPadAsync(pid, expiration) {
    var adapter = new MongoskinAdapter(db, ObjectId());
    var masterDoc = new gulf.Document({
        storageAdapter: adapter,
        ottype: ottype
    });
    //adapter.docId = doc.id;
    masterDoc.id = adapter.docId;
    
    return masterDoc.initializeFromStorage(starttext).then(function() {
        // Create pad object
        var pad = {
            '_id': pid,
            'did': masterDoc.id,
            'expiration': expiration
        };
        
        // Set values to maps (cache)
        padIdToDocMap[pid] = masterDoc; // TODO Reset
        docIdToPadMap[masterDoc.id] = pad;
        
        // Store pad object in pad collection
        return db.collection('pads').insertAsync(pad);
    });
}
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
    var masterDoc = padIdToDocMap[pid];
    if (!_.isUndefined(masterDoc))
        return Promise.resolve(masterDoc);

    // if not in map, load or handle error
    return db.collection('pads').
        findOneAsync({ '_id': pid }).then(function(pad) {
            if (_.isNull(pad))
                return Promise.reject({reason: 'PAD_DOES_NOT_EXIST'});
            else {
                var adapter = new MongoskinAdapter(db, pad.did);
                var masterDoc = new gulf.Document({
                    storageAdapter: adapter,
                    ottype: ottype
                });
                
                masterDoc.id = pad.did;
                return masterDoc.initializeFromStorage().then(function() {
                    padIdToDocMap[pid] = masterDoc; // Reset
                    docIdToPadMap[masterDoc.id] = pad;
                    return Promise.resolve(masterDoc);
                });
            }
        });
}

exports.startPadServer = function(io) {
    io.on('connection', function(socket) {
        socket.on('pad_identity', function(identity) {
            getPadDocAsync(ObjectId(identity.pid)).then(function(masterDoc) {
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
