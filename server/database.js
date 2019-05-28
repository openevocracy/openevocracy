var mongoskin = require('mongoskin');
var promisify = require('./promisify');
var cfg = require('../shared/config').cfg;

// promisify mongoskin
var ms = promisify(mongoskin);

// Get DB path from 
var dbpath = cfg.PRIVATE.DATABASE_HOST;

exports.db = ms.db(dbpath);
exports.sharedb = require('sharedb-mongo')(dbpath);

const mongoist = require('mongoist');
exports.db2 = mongoist(dbpath);