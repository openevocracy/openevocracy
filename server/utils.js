var _ = require('underscore');
var rp = require('request-promise');
var requirejs = require('requirejs');
var db = require('./database').db;

exports.sendNotification = function(res,status,message) {
    res.status(status).send({'status': status, 'message': message});
};
exports.rejectPromiseWithNotification = function(status,message) {
    return Promise.reject({'status': status, 'message': message});
};
exports.isOwnError = function(error) {
    return _.has(error,'status') && _.has(error,'message') || _.has(error,'reason');
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
