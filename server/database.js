var mongoskin = require('mongoskin');

// promisify mongoskin
var Promise = require('bluebird');
Object.keys(mongoskin).forEach(function(key) {
  var value = mongoskin[key];
  if (typeof value === "function") {
    Promise.promisifyAll(value);
    Promise.promisifyAll(value.prototype);
  }
});
Promise.promisifyAll(mongoskin);

exports.db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
