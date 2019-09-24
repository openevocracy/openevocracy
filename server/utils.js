const _ = require('underscore');
const rp = require('request-promise');
const db = require('./database').db;
const ObjectId = require('mongodb').ObjectID;
const cfg = require('../shared/config').cfg;
const fs = require('fs');

function prepareAlert(type, content, vars) {
    vars = vars || null;
    return { 'type': type, 'content': content, 'vars': vars };
}

/**
 * @desc: Send alert message to client
 */
exports.sendAlert = function(res, status, type, content, vars) {
    res.status(status).send({ 'alert': prepareAlert(type, content, vars) });
};

/**
 * @desc: Send simple message to client
 */
exports.sendMessage = function(res, status, msg) {
    res.status(status).send({ 'status': status, 'msg': msg });
};

/**
 * @desc: Wrapper for Promise.reject() which allows to send a
 *        simple error message to the client
 */
exports.rejectPromiseWithMessage = function(status, msg) {
	return Promise.reject({ 'status': status, 'msg': msg });
};

/**
 * @desc: Wrapper for Promise.reject() which allows to send a
 *        more complex alert message to the client
 */
exports.rejectPromiseWithAlert = function(status, type, content, vars) {
    return Promise.reject({ 'status': status, 'alert': prepareAlert(type, content, vars) });
};

/**
 * @desc: Checks if an object is an own error which implies that the object
 *        has a key 'status', which represents the http status code
 */
exports.isOwnError = function(error) {
	return _.has(error,'status');
    //return _.has(error,'status') && _.has(error,'alert') || _.has(error,'reason');
};

/**
 * @desc: Handles an own error, which basically means that the result is sent
 *        to the server and a specific html status code is used
 */
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
 *        returns true or false
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

/*
 * @desc: Check if two objects id's are equal, returns true or false
 */
exports.equalId = function(a, b) {
	return (a.toString() == b.toString());
};

/*
 * @desc: Count number of words from html document
 */
exports.countHtmlWords = function(html) {
	// Remove tags, split and get length
	return html.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+\b/).length;
};

/*
 * @desc: Send config file, but omit private configuration information
 *        (e.g. mail credentials)
 */
exports.config = function(req, res) {
	res.send(_.omit(cfg, 'PRIVATE'));
};

/*
 * @desc: ping request from client, response with timestamp
 */
/*exports.ping = function(req, res) {
	var now = Date.now();
	res.json({'timestamp': now});
};*/


/**
 * @desc: Compares keys of two objects and returns true,
 *        if both contain identical keys
 * @link: https://stackoverflow.com/a/14368628/2692283, accessed 2019-02-26
 */
function compareKeys(a, b) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return (JSON.stringify(aKeys) === JSON.stringify(bKeys));
}
exports.compareKeys = compareKeys;

/**
 * @desc: Checks if all config.env.* files contain the same variables
 */
exports.checkConfig = function() {
	const sharedFolder = './shared/';
	// Read all config files in shared folder
	fs.readdir('./shared/', (err, files) => {
		// Loop through all config files
		files.forEach(file => {
			// Only apply to files that start with config.env.*
			if (file.startsWith('config.env.')) {
				// Remove '.js' from file name
				file = file.replace('.js', '');
				// Get config from current file
				const cfgFromFile = require('../shared/'+file).cfg;
				// Check if cfg's from files contain the same variable than the used cfg
				if (!compareKeys(cfg, cfgFromFile))
					console.error('WARNING: Check config files, some variables differ between config files.');
			}
		});
	});
};

/**
 * @desc: Strips html tags from given string
 */
exports.stripHtml = function (htmlString) {
	return htmlString.replace(/<(?:.|\n)*?>/gm, '');
};

/**
 * @desc: Removes an object id from array of object ids
 */
exports.withoutObjectId = function(arr, idToRemove) {
	return arr.filter(function(el) {
		return !el.equals(idToRemove);
	});
};

/**
 * @desc: Replace all occurencies of 'find' in a string 'str' and replace it by 'replace'
 */
exports.replaceAll = function(str, find, replace) {
	// Make search safe against special characters in regular expressions
	const findSave = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	// Replace all
	return str.replace(new RegExp(findSave, 'g'), replace);
};
