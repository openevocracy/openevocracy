var _ = require('underscore');
var rp = require('request-promise');
var requirejs = require('requirejs');
var db = require('./database').db;

function prepareAlert(type, content, vars) {
    vars = vars || false;
    return { 'type': type, 'content': content, 'vars': vars };
}

exports.sendAlert = function(res, status, type, content, vars) {
    res.status(status).send({'alert': prepareAlert(type, content, vars)});
};
exports.rejectPromiseWithAlert = function(status, type, content, vars) {
    return Promise.reject({'status': status, 'alert': prepareAlert(type, content, vars)});
};
exports.isOwnError = function(error) {
    return _.has(error,'status') && _.has(error,'alert') || _.has(error,'reason');
};
exports.handleOwnError = function(res) {
    return function(error) {
        res.status(error.status).send(error);
    };
};

var ObjectIdToStringMapper = exports.ObjectIdToStringMapper = function(obj) {
    return _.mapObject(obj,function(val) {
        return val.toString();
    });
};

var ObjectIdToStringMapperArray = exports.ObjectIdToStringMapperArray = function(objs) {
    return _.map(objs,ObjectIdToStringMapper);
};

exports.findWhereArrayEntryExists = function(objs,obj) {
    return _.findWhere(ObjectIdToStringMapperArray(objs),
                       ObjectIdToStringMapper(obj));
};

exports.checkArrayEntryExists = function(objs,obj) {
    return _.findWhere(ObjectIdToStringMapperArray(objs),
                       ObjectIdToStringMapper(obj)) != undefined;
};
