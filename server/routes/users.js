var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var requirejs = require('requirejs');
var validate = require('validate.js');
var strformat = require('strformat');

var i18n = require('../i18n');
var topics = require('./topics');
var mail = require('../mail');
var utils = require('../utils');

var C = require('../../setup/constants.json');
var cfg = requirejs('public/js/setup/configs');

// cookie config
var config = {
    port: 3000,
    sessionSecret: 'bb-login-secret',
    cookieSecret: 'bb-login-secret',
    cookieMaxAge: (1000 * 60 * 60 * 24 * 36)
};

function clean_user_data(user) {
    return _.omit(user, ['pass', 'auth_token']);
}

function savePasswordInDatabaseAsync(uid, password) {
    var hash = bcrypt.hashSync(password, 8);
    return db.collection('users').updateAsync({ '_id': uid }, { $set: { 'pass': hash } });
}

function getUserByMailAsync(email) {
    return db.collection('users').findOneAsync({'email': email}, {'_id': true});
}

// authentication wrapper, e.g. app.get('/json/topics', auth(req,res,function(req, res) ...
exports.auth_wrapper = function(req, res, next) {
    next(req, res);
    return;
    
    db.collection('users').findOne({'_id': ObjectId(req.user._id),
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
};

// authentification
// TODO use middleware, e.g. Passport?
exports.auth = function(req, res) {
    db.collection('users').findOne({ '_id': ObjectId(req.user._id),
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

exports.sendVerificationMailAgain = function(req, res) {
    // Get email from query and user id from database
    var email = req.params.email;
    
    getUserByMailAsync(email).then(function(user) {
        // Break if no user was found
        if(_.isNull(user)) {
            utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', email);
            return;
        }
            
        // Send verification mail
        user.email = email;
        sendVerificationMail(user);
        // Send alert notification to client
        utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_VERIFICATION_LINK_SENT'); 
    });
};

function sendVerificationMail(user) {
    console.log('sendVerificationMail');
    mail.sendMail(user.email,
        i18n.t('EMAIL_REGISTRATION_SUBJECT'),
        strformat(i18n.t('EMAIL_REGISTRATION_MESSAGE'), user._id.toString(), cfg.EVOCRACY_HOST)
    );
}

exports.sendPassword = function(req, res) {
    var email = req.params.email;
    
    getUserByMailAsync(email).then(function(user) {
        // Break if no user was found
        if(_.isNull(user)) {
            utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', email);
            return;
        }
        
        // Generate new password
        var password = Math.random().toString(36).slice(2);
        
        // Send password via email to user
        mail.sendMail(email, i18n.t('EMAIL_PASSWORD_RESET_SUBJECT'),
            strformat(i18n.t('EMAIL_PASSWORD_RESET_MESSAGE'), password));
        
        // Save new password in database and send response
        return savePasswordInDatabaseAsync(user._id, password).then(function() {
            utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_PASSWORD_RESET', email);
        });
    });
};

function loginUser(req, res, err, user) {
    if(user) {
        // Compare the POSTed password with the encrypted db password
        if(bcrypt.compareSync(req.body.pass, user.pass)) {
            // Check email verification
            if(!user.verified) {
                utils.sendAlert(res, 401, 'warning', 'USER_ACCOUNT_NOT_VERIFIED', user.email);
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
            utils.sendAlert(res, 401, 'danger', 'USER_PASSWORT_NOT_CORRECT', req.body.name);
        }
    } else {
        if(req.body.name) {
            // Could not find the username
            utils.sendAlert(res, 401, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', req.body.name);
        } else {
            utils.sendAlert(res, 401, 'danger', 'USER_FORM_EMAIL_MISSING');
        }
    }
}

// creates a user
exports.signup = function(req, res) {
    var user = req.body;
    
    // Setup parseley
    var constraints = {
        email: { presence: true, email: true },
        pass: { presence: true, format: /^\S+$/ } // no whitespace
    };
    var form = _.pick(user, 'email', 'pass');
    
    // check if values are valid
    if(validate(form, constraints) !== undefined) {
        // values are NOT valid
        utils.sendAlert(res, 400, 'danger', 'USER_FORM_VALIDATION_ERROR');
    } else {
        // assemble user
        user = {
            email: user.email,
            pass: bcrypt.hashSync(user.pass, 8),
            auth_token: bcrypt.genSaltSync(8),
            verified: false
        };
        
        // url: https://www.npmjs.org/package/bcrypt-nodejs
        db.collection('users').findOneAsync(_.pick(user, 'email'), {'verified': true}).then(function(user) {
            // Check if user already exists and check verification status
            if(!_.isNull(user) && user.verified)
                return utils.rejectPromiseWithAlert(400, 'warning', 'USER_ACCOUNT_ALREADY_EXISTS');
            else if(!_.isNull(user) && !user.verified)
                return utils.rejectPromiseWithAlert(401, 'warning', 'USER_ACCOUNT_NOT_VERIFIED', user.email);
        }).then(function() {
            // Add user to database
            return db.collection('users').insertAsync(user).return(user);
        }).then(function(user) {
            // Log and send verification mail to user
            console.log('Saved user ' + JSON.stringify(user));
            utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_VERIFICATION_LINK_SENT');
            sendVerificationMail(user);
        }).catch(utils.isOwnError,utils.handleOwnError(res));
    }
};

// POST /json/auth/logout
// @desc: logs out a user, clearing the signed cookies
exports.logout = function(req, res) {
    // FIXME the actual logout is missing
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

// GET /json/user/profile/:id
exports.query = function(req, res) {
    var uid = ObjectId(req.params.id);
    
    db.collection('users').findOneAsync(
        {'_id':uid},{'email':false,'pass':false,'auth_token':false}).
        then(res.send.bind(res));
};

// GET /json/user/settings/:id
exports.settings = function(req, res) {
    var uid = ObjectId(req.params.id);
    
    db.collection('users').findOneAsync(
        {'_id':uid},{'pass':false,'auth_token':false}).
        then(res.send.bind(res));
};

// PATCH /json/user/settings/:id
exports.update = function(req, res) {
    var uid = ObjectId(req.user._id);
    var userUpdate = req.body;
    var validation = null;
        
    // E-mail was updated
    if(_.has(userUpdate, 'email')) {
        // Validate email using parseley
        validation = validate(_.pick(userUpdate, 'email'), { email: { presence: true, email: true } });
        
        if(!_.isUndefined(validation)) {
            // If email is NOT valid
            utils.sendAlert(res, 200, 'danger', 'USER_FORM_VALIDATION_ERROR_EMAIL');
        } else {
            // If email is valid
            db.collection('users')
                .updateAsync({ '_id': uid }, { $set: _.pick(userUpdate, "email") })
                .then(function() {
                    utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_EMAIL_UPDATED');
                });
        }
    }
    
    // Language was updated
    if(_.has(userUpdate, 'lang')) {
        db.collection('users')
            .updateAsync({ '_id': uid }, { $set: _.pick(userUpdate, "lang") })
            .then(function() {
                utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_LANG_UPDATED');
            });
    }
    
    // Password was updated
    if(_.has(userUpdate, 'pass')) {
        // Validate password using parseley (no whitespace)
        validation = validate(_.pick(userUpdate, 'pass'), { pass: { presence: true, format: /^\S+$/ } });
        
        if(!_.isUndefined(validation)) {
            // If password is NOT valid
            utils.sendAlert(res, 200, 'danger', 'USER_FORM_VALIDATION_ERROR_PASSWORD');
        } else {
            // If password is valid
            savePasswordInDatabaseAsync(uid, userUpdate['pass']).then(function() {
                utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_PASSWORD_UPDATED');
            });
        }
    }
};

// GET /json/user/navi
exports.navigation = function(req, res) {
    var uid = ObjectId(req.user._id);

    var topicsPrePromise = db.collection('proposals').
        find({'source': uid}, {'tid': true}).toArrayAsync().then(function(tids) {
            return db.collection('topics').find({'_id': { $in: _.pluck(tids, 'tid') }},
                {'name': true, 'stage': true, 'level': true, 'nextDeadline': true}).toArrayAsync();
        });
    
    var proposalsPromise = topicsPrePromise.filter(function(topic) {
        return topic.stage == C.STAGE_PROPOSAL;
    }).map(function(topic){
        return db.collection('proposals').
            findOneAsync({'source': uid, 'tid': topic._id}, {'_id': true}).
            then(function(proposal) {
                if(proposal)
                    return {'_id': proposal._id, 'name': topic.name, 'nextDeadline': topic.nextDeadline};
                else
                    return null;
            });
    });
    
    var groupsPromise = topicsPrePromise.filter(function(topic) {
        return topic.stage == C.STAGE_CONSENSUS;
    }).map(function(topic) {
        return db.collection('group_members').
            find({'uid': uid}, {'gid': true}).toArrayAsync().then(function(group_members) {
                return db.collection('groups').findOneAsync(
                    {'_id': { $in: _.pluck(group_members, 'gid')}, 'tid': topic._id, 'level': topic.level },
                    {'_id': true});
            }).then(function(group) {
                if(group)
                    return {'_id': group._id, 'name': topic.name, 'nextDeadline': topic.nextDeadline};
                else
                    return null;
            });
    }).filter(function(group) {
        return _.isObject(group);
    });
    
    var topicsPromise = topicsPrePromise.filter(function(topic) {
        return (topic.stage == C.STAGE_SELECTION || topic.stage == C.STAGE_PROPOSAL || topic.stage == C.STAGE_CONSENSUS);
    });
    
    Promise.props({
        'proposals': proposalsPromise,
        'topics': topicsPromise,
        'groups': groupsPromise
    }).then(res.json.bind(res)).
    catch(utils.isOwnError,utils.handleOwnError(res));
};
