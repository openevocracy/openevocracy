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
    try {
        // Try to create ObjectID, if it works, search for ObjectID
        db.collection('users').findOne({ '_id': ObjectId(req.body.name) }, _.partial(loginUser, req, res));
    } catch(err) {
        // Fall back to using email for login
        db.collection('users').findOne({ 'email': req.body.name }, _.partial(loginUser, req, res));
    }
};

function loginUser(req, res, err, user) {
    if(user) {
        // Compare the POSTed password with the encrypted db password
        if( bcrypt.compareSync( req.body.pass, user.pass) ){
            res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge });
            
            // Correct credentials, return the user object
            res.json({ 'user': clean_user_data(user) });
            
            console.log('User login valid ' + JSON.stringify(user));
        } else {
            // Username did not match password given
            res.status(403).send('Password is not correct.');
        }
    } else {
        // Could not find the username
        res.status(403).send('User "'+req.body.name+'" does not exist.');
    }
};

// creates a user
exports.signup = function(req, res) {
    var user = req.body;
    
    var constraints = {
        email: { presence: true, email: true },
        pass: { presence: true, format: /^\S+$/ } // no whitespace
    };
    var form = {email: user.email, pass: user.pass};
    
    // check if values are valid
    if(validate(form, constraints) !== undefined) {
        // values are NOT valid
        res.status(400).send("An error occured, please check the form.");
    } else {
        // assemble user
        user.pass = bcrypt.hashSync(user.pass, 8);
        user.auth_token = bcrypt.genSaltSync(8);
        
        // check if user already exist
        // url: https://www.npmjs.org/package/bcrypt-nodejs
        db.collection('users').countAsync(_.pick(user, 'email')).then(function(count) {
            // check if user already exists
            if(count > 0)
                return Promise.reject({status: 400, message: "Account already exists."});
        }).then(function() {
            return db.collection('users').insertAsync(user);
        }).then(function(user){
            // get first element
            user = user[0];
            
            console.log('Saved user ' + JSON.stringify(user));
            res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge  });
            res.json( {'user': clean_user_data(user)} );
            
            // send mail
            var subject = 'Your registration at Evocracy';
            var text =  'Welcome '+ user._id +' at Evocracy,\r\n\r\n'+
                        'you just created an account at https://mind-about-sagacitysite.c9.io, '+
                        'if you were not the one doing this, just ignore this message.\r\n';
            utils.sendMail(user.email, subject, text);
        }).catch(utils.isOwnError,utils.handleOwnError(res));
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