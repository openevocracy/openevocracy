var request = require('request');
var rp = require('request-promise');

exports.getPadBody = function(pid,done) {
    // get html export
    var padurl = 'https://beta.etherpad.org/p/'+pid+'/export/html';
    request.get(padurl,function(error, response, data) {
        var str = data.replace(/\r?\n/g, "");
        var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
        done(body);
    });
};

exports.getPadBodyAsync = function(pid) {
    // get html export
    var padurl = 'https://beta.etherpad.org/p/'+pid+'/export/html';
    return rp.get(padurl).then(function(data) {
        var str = data.replace(/\r?\n/g, "");
        var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
        
        return body;
    });
};
