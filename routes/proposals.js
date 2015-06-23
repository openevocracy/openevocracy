var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

exports.query = function(req, res) {
    var tid = ObjectId(req.params._id);
    var uid = ObjectId(req.signedCookies.uid);
    
    // get proposal or create proposal if it does not exist
    // from http://stackoverflow.com/questions/16358857/mongodb-atomic-findorcreate-findone-insert-if-nonexistent-but-do-not-update
    db.collection('proposals').findAndModify(
        { 'tid':tid, 'uid':uid },
        [],
        { $setOnInsert: {pid: ObjectId()}},
        { new: true, upsert: true },
        function(err, proposal) {
            res.json(proposal);
        });
};