var request = require('request');

exports.getPadBody = function(pid,done) {
    // get html export
    var padurl = 'https://beta.etherpad.org/p/'+pid+'/export/html';
    request.get(padurl,function(error, response, data) {
        var str = data.replace(/\r?\n/g, "");
        var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
        done(body);
    });
}
