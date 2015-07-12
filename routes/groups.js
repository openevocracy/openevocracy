var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

exports.list = function(req, res) {
    db.collection('groups').find().toArray(function(err, groups) {
        console.log('get groups');
        res.json(groups);
    });
};

// get group by id
exports.query = function(req, res) {

    // get group pad or create group pad if it does not exist
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    db.collection('groups').findAndModify(
        { '_id': ObjectId(req.params.id) },
        [],
        { $setOnInsert: {pid: ObjectId()}},
        { new: true, upsert: true },
        function(err, group) {
            res.json(group);
    });
};