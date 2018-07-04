var _ = require('underscore');
var rp = require('request-promise');
//var requirejs = require('requirejs');
var db = require('./database').db;
var ObjectId = require('mongodb').ObjectID;

function prepareAlert(type, content, vars) {
    vars = vars || null;
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
    return _.map(objs, ObjectIdToStringMapper);
};

/*
 * @desc: Simple helper function to simplify toString calls in underscore functions
 */
var toStr = function(str) {
	return str.toString();
};

/*
 * @desc: underscore.js _.findWhere function is not working if you want to find an ObjectId
 */
exports.findWhereObjectId = function(objs, obj) {
	return _.find(objs, function(el) {
		return _.some(_.keys(el), function(key) {
			return (key == _.keys(obj)[0] && el[key].equals(obj[key]));
		});
	});
};

/*
 * @desc: underscore.js _.contains function is not working if you want to find an ObjectId
 *        note that this function is simplified, compared to the original _.contains function
 */
exports.containsObjectId = function(arr, item) {
	return _.indexOf(_.map(arr, toStr), item.toString()) >= 0;
};

exports.checkArrayEntryExists = function(objs, obj) {
    return _.findWhere(ObjectIdToStringMapperArray(objs),
                       ObjectIdToStringMapper(obj)) != undefined;
};

/*
 * @desc: Merges two collections by specific id
 *        Function is taken from: https://stackoverflow.com/a/32701655/2692283
 */
exports.mergeCollections = function(listA, listB, idField) {
	var indexB = _.indexBy(listB, idField);
	return _.map(listA, function(obj, key) {
		return _.extend(obj, indexB[obj[idField]]);
	});
};
