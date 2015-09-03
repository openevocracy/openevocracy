var _ = require('underscore');
var bcrypt = require('bcrypt');
var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var ObjectId = require('mongodb').ObjectID;

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
            //console.log('User authentication valid ' + JSON.stringify(user));

            // handle request
            next(req, res);
        } else {
            // redirect to login
            // res.redirect("/#/login"); FIXME login server-sided possible? seems not (main.js:88)
            
            // from https://vickev.com/?_escaped_fragment_=/article/authentication-in-single-page-applications-node-js-passportjs-angularjs#!/article/authentication-in-single-page-applications-node-js-passportjs-angularjs
            res.sendStatus(401);
            
            console.log('User authentication invalid');
            // res.json({ error: "Client has no valid login cookies." });
        }
    });
}

// authentification
// TODO use middleware, e.g. Passport?
exports.auth = function(req, res) {
    db.collection('users').findOne({ '_id': ObjectId(req.signedCookies.uid),
                                     'auth_token': req.signedCookies.auth_token },
    function(err, user){
        if(user){
            res.json({ 'user':clean_user_data(user) });
        } else {
            //res.json({ error: "Client has no valid login cookies."  });
            res.redirect("/#/");
        }
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
                //res.json({ error: "Invalid username or password."  });   
                res.redirect("/#/");
                
                console.log('Userpassword invalid ' + JSON.stringify(user));
            }
        } else {
            // Could not find the username
            //res.json({ error: "Username does not exist."  });   
            res.redirect("/#/");

            console.log('Username invalid ' + JSON.stringify(req.body.name));
        }
    });
};

// creates a user
exports.signup = function(req, res) {
    var user = req.body;
    
    user.pass = bcrypt.hashSync(user.pass, 8);
    user.auth_token = bcrypt.genSaltSync(8);
    
    // url: https://www.npmjs.org/package/bcrypt-nodejs
    db.collection('users').insert(user, function(err, user){

        // get first element
        user = user[0];

        if(err){
            res.json({ error: "Error while trying to register user " + JSON.stringify(user) });
            console.log(err);
        } else {
            console.log('Saved user ' + JSON.stringify(user));
            res.cookie('uid', user._id, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('name', user.name, { signed: true, maxAge: config.cookieMaxAge });
            res.cookie('auth_token', user.auth_token, { signed: true, maxAge: config.cookieMaxAge  });
            res.json( {'user': clean_user_data(user)} );
            // TODO Login/Signup trennen
        }
    });
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