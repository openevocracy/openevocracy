var mongoskin = require('mongoskin');
var promisify = require('./promisify');

// promisify mongoskin
var mongoskin = promisify(mongoskin);

var dbpath = process.env.MONGODB ? process.env.MONGODB : 'mongodb://127.0.0.1/evocracy';
console.log(dbpath);

exports.db = mongoskin.db(dbpath);
exports.sharedb = require('sharedb-mongo')(dbpath);
