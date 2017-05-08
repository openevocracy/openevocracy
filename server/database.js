var mongoskin = require('mongoskin');
var promisify = require('./promisify');

// promisify mongoskin
var mongoskin = promisify(mongoskin);

exports.db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
