var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var validate = require('validate.js');
var topics = require('./topics');
var mail = require('../mail');
var utils = require('../utils');

var C = requirejs('public/js/setup/constants');
var cfg = requirejs('public/js/setup/configs');

// cookie config
var config = {
    port: 3000,
    sessionSecret: 'bb-login-secret',
    cookieSecret: 'bb-login-secret',
    cookieMaxAge: (1000 * 60 * 60 * 24 * 36)
}

function clean_user_data(user) {
    return _.omit(user, ['pass', 'auth_token']);
}

// authentication wrapper, e.g. app.get('/json/topics', auth(req,res,function(req, res) ...
exports.auth_wrapper = function(req, res, next) {
    db.collection('users').findOne({'_id': ObjectId(req.signedCookies.uid),
                                    'auth_token': req.signedCookies.auth_token },
    function(err, user){
        if(user){
            // handle request
            next(req, res);
        } else {
            // from https://vickev.com/?_escaped_fragment_=/article/authentication-in-single-page-applications-node-js-passportjs-angularjs#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs
            res.status(401);
            
            console.log('User authentication invalid');
        }
    });
}

// authentification
// TODO use middleware, e.g. Passport?
exports.auth = function(req, res) {
    db.collection('users').findOne({ '_id': ObjectId(req.signedCookies.uid),
                                     'auth_token': req.signedCookies.auth_token },
    function(err, user){
        if(user)
            res.send({user: clean_user_data(user)});
        else
            res.status(403);
    });
};

// POST /api/auth/login
// @desc: logs in a user
exports.login = function(req, res) {
    try {
        // Try to create ObjectID, if it works, search for ObjectID
        db.collection('users').findOne({ '_id': ObjectId(req.body.name) }, _.partial(loginUser, req, res));
    } catch(err) {
        // Fall back to using email for login
        db.collection('users').findOne({ 'email': req.body.name }, _.partial(loginUser, req, res));
    }
};

function sendVerificationMail(user) {
    var subject = 'Your registration at Evocracy';
    var text =  'Welcome '+ user._id.toString() +' at Evocracy,\r\n'+
                'You just created an account at '+cfg.EVOCRACY_HOST+'.\r\n\r\n'+
                'Please verify your email by visiting:\r\n'+
                cfg.EVOCRACY_HOST+'/json/auth/verifyEmail/'+user._id.toString()+'\r\n\r\n'+
                'If you did not register, just ignore this message.\r\n';
    mail.sendMail(user.email, subject, text);
}

function loginUser(req, res, err, user) {
    if(user) {
        // Compare the POSTed password with the encrypted db password
        if( bcrypt.compareSync( req.body.pass, user.pass) ) {
            // Check email verification
            if(!user.verified) {
                utils.sendNotification(res, 401, "You have not verified your email-address. Verification email has been sent again. Please check your inbox.");
                sendVerificationMail(user);
                return;
            }
            
            // Setup cookies
            res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge });
            
            // Correct credentials, return the user object
            res.send({user: clean_user_data(user)});
            // Log
            console.log('User login valid ' + JSON.stringify(user));
        } else {
            // Username did not match password given
            utils.sendNotification(res, 401, "Password is not correct.");
        }
    } else {
        // Could not find the username
        utils.sendNotification(res, 401, 'User "'+req.body.name+'" does not exist.');
    }
};

// creates a user
exports.signup = function(req, res) {
    var user = req.body;
    
    // setup parseley
    var constraints = {
        email: { presence: true, email: true },
        pass: { presence: true, format: /^\S+$/ } // no whitespace
    };
    var form = _.pick(user, 'email', 'pass');
    
    // check if values are valid
    if(validate(form, constraints) !== undefined) {
        // values are NOT valid
        utils.sendNotification(res, 400, "An error occured, please check the form.");
    } else {
        // assemble user
        user = {
            email: user.email,
            pass: bcrypt.hashSync(user.pass, 8),
            auth_token: bcrypt.genSaltSync(8),
            verified: false
        };
        
        // check if user already exist
        // url: https://www.npmjs.org/package/bcrypt-nodejs
        db.collection('users').countAsync(_.pick(user, 'email')).then(function(count) {
            // check if user already exists
            if(count > 0)
                return utils.rejectPromiseWithNotification(400, "Account already exists.");
        }).then(function() {
            return db.collection('users').insertAsync(user).return(user);
        }).then(function(user) {
            console.log('Saved user ' + JSON.stringify(user));
            utils.sendNotification(res, 200, "To verify your email address, we\'ve sent an email to you. Please check your inbox and click the link.");
            sendVerificationMail(user);
        }).catch(utils.isOwnError,utils.handleOwnError(res));
    }
};

// POST /json/auth/logout
// @desc: logs out a user, clearing the signed cookies
exports.logout = function(req, res) {
    res.clearCookie('uid');
    res.clearCookie('auth_token');
    res.send();
};

// POST /json/auth/verifyEmail
exports.verifyEmail = function(req, res) {
    db.collection('users').updateAsync(
        {'_id': ObjectId(req.params.id)}, { $set: {verified: true} }, {}
     ).then(function() {
        res.redirect('/#/verified');
    });
};

/*// POST /api/auth/remove_account
// @desc: deletes a user
app.post("/api/auth/remove_account", function(req, res) {
    db.run("DELETE FROM users WHERE id = ? AND auth_token = ?", [ req.signedCookies.user_id, req.signedCookies.auth_token ], function(err, rows){
        if(err){ 
            res.json({ error: "Error while trying to delete user." }); 
        } else {
            res.clearCookie('user_id');
            res.clearCookie('auth_token');
            res.json({ success: "User successfully deleted." });
        }
    });
});*/

exports.query = function(req, res) {
    var uid = ObjectId(req.params.id);
    
    db.collection('users').findOneAsync(
        {'_id':uid},{'email':false,'pass':false,'auth_token':false}).
        then(res.send.bind(res));
};

// GET /json/user/navi
exports.navigation = function(req, res) {
    var uid = ObjectId(req.signedCookies.uid);
    
    var topicsPromise = db.collection('topic_participants').
        find({'uid': uid}, {'tid': true}).toArrayAsync().then(function(tids) {
            return db.collection('topics').find({'_id': { $in: _.pluck(tids, 'tid') }},
                {'name': true, 'stage': true, 'level': true}).toArrayAsync();
        }).map(function(topic) {
            return topics.appendBasicTopicInfo(topic);
        });
    
    var groupsPromise = db.collection('group_members').
        find({'uid': uid}, {'gid': true}).toArrayAsync().then(function(group_members) {
            return db.collection('groups').find(
                {'_id': { $in: _.pluck(group_members, 'gid') }},
                {'tid': true}).toArrayAsync();
        }).then(function(groups) {
            var topicsPromise = db.collection('topics').
                find({'_id': { $in: _.pluck(groups, 'tid') }},
                {'name': true, 'nextDeadline': true}).toArrayAsync();
            
            return Promise.join(topicsPromise, groups);
        }).spread(function (topics, groups) {
            return _.zip(topics, groups);
        }).map(function (tg) {
            return _.extend(_.pick(tg[0],'name','nextDeadline'),
                            _.pick(tg[1],'_id'));
        });
    
    var proposalsPromise = db.collection('proposals').
        find({'source': uid}, {'tid': true}).toArrayAsync().then(function(proposals) {
            return db.collection('topics').find(
                {'_id': { $in: _.pluck(proposals, 'tid') },
                'stage': C.STAGE_PROPOSAL},
                {'name': true, 'nextDeadline': true}).toArrayAsync();
        });

    Promise.props({
        'topics': topicsPromise,
        'groups': groupsPromise,
        'proposals': proposalsPromise
    }).then(res.json.bind(res)).
    catch(utils.isOwnError,utils.handleOwnError(res));
};