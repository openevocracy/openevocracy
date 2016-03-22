var _ = require('underscore');
var bcrypt = require('bcrypt');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var validate = require('validate.js');
var utils = require('../utils');

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
            res.sendStatus(401);
            
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
            res.json({ 'user': clean_user_data(user) });
        else
            res.sendStatus(403);
    });
};

// POST /api/auth/login
// @desc: logs in a user
exports.login = function(req, res) {
    db.collection('users').findOne({ 'name': req.body.name }, function(err, user){
        if(user){
            // Compare the POSTed password with the encrypted db password
            if( bcrypt.compareSync( req.body.pass, user.pass) ){
                res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
                res.cookie('name', user.name, { signed: true, maxAge: config.cookieMaxAge });
                res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge });
                
                // Correct credentials, return the user object
                res.json({ 'user': clean_user_data(user) });
                
                console.log('User login valid ' + JSON.stringify(user));
                
            } else {
                // Username did not match password given
                res.sendStatus(403);
                
                console.log('Userpassword invalid ' + JSON.stringify(user));
            }
        } else {
            // Could not find the username
            res.sendStatus(403);
            
            console.log('Username invalid ' + JSON.stringify(req.body.name));
        }
    });
};

// creates a user
exports.signup = function(req, res) {
    var user = req.body;
    
    var constraints = {
        name: { presence: true, format: /^[0-9A-F]{8}$/ },
        email: { presence: true, email: true },
        pass: { presence: true, format: /^\S+$/ } // no whitespace
    };
    var form = {name: user.name, email: user.email, pass: user.pass};
    
    // check if values are valid
    if(validate(form, constraints) !== undefined) {
        // values are NOT valid
        user.validation_error = 'Please check the form for mistakes.';
        res.json(user);
        // FIXME: in register.js (view) res is undefined ??
    } else {
        // assemble user
        user.pass = bcrypt.hashSync(user.pass, 8);
        user.auth_token = bcrypt.genSaltSync(8);
        
        // check if user already exist
        // url: https://www.npmjs.org/package/bcrypt-nodejs
        db.collection('users').countAsync(_.pick(user, 'name')).then(function(count) {
            // user already exists
            if(count > 0) {
                //user.validation_error = 'User ID already exists, try another one.';
                //res.json(user);
                res.sendStatus(403);
                return Promise.reject(); // FIXME "Unhandled rejection Error"
            }
        }).cancellable().then(function() {
            return db.collection('users').insertAsync(user);
        }).then(function(user){
            // get first element
            user = user[0];
            
            console.log('Saved user ' + JSON.stringify(user));
            res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('name', user.name, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge  });
            res.json( {'user': clean_user_data(user)} );
            
            // send mail
            /*var subject = 'Your registration at Evocracy';
            var text =  'Welcome '+ user.name +' at Evocracy,\r\n\r\n'+
                        'you just created an account at https://mind-about-sagacitysite.c9.io, '+
                        'if you were not the one doing this, just ignore this message.\r\n';
            utils.sendMail(user.email, subject, text);*/
        });
    }
};

// POST /api/auth/logout
// @desc: logs out a user, clearing the signed cookies
exports.logout = function(req, res) {
    res.clearCookie('uid');
    res.clearCookie('name');
    res.clearCookie('auth_token');
    res.sendStatus(200);
    
    console.log('User successfully logged out');
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