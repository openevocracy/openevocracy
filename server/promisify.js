var Promise = require('bluebird');

module.exports = function(obj) {
    Object.keys(obj).forEach(function(key) {
        var value = obj[key];
        if (typeof value === "function") {
            Promise.promisifyAll(value);
            Promise.promisifyAll(value.prototype);
        }
    });
    Promise.promisifyAll(obj);
    
    return obj;
}