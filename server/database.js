var mongoskin = require('mongoskin');
var promisify = require('./promisify');

// promisify mongoskin
var mongoskin = promisify(mongoskin);

var dbpath = 'mongodb://127.0.0.1/evocracy';

exports.db = mongoskin.db(dbpath);
exports.sharedb = require('sharedb-mongo')(dbpath);
