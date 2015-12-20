var _ = require('underscore');
var rp = require('request-promise');
        
var ObjectIdToStringMapper = exports.ObjectIdToStringMapper = function(obj) {
    return _.mapObject(obj,function(val) {
        return val.toString();
    });
};

var ObjectIdToStringMapperArray = exports.ObjectIdToStringMapperArray = function(objs) {
    return _.map(objs,ObjectIdToStringMapper);
};

exports.checkArrayEntryExists = function(objs,obj) {
    return _.findWhere(ObjectIdToStringMapperArray(objs),
                       ObjectIdToStringMapper(obj)) != undefined;
};

exports.getPadBodyAsync = function(pid) {
    // get html export
    var padurl = 'https://beta.etherpad.org/p/'+pid+'/export/html';
    return rp.get(padurl).then(function(data) {
        
        //var body = data.statusCode;
        var str = data.replace(/\r?\n/g, "");
        var body = str.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
        
        return body;
    }).timeout(1000).catch(function (err) {
        return err.message;
    });
};
