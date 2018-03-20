/**
 * Module dependencies.
 */

var _ = require('underscore');
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var http = require('http');
var cookieParser = require('cookie-parser');
//var cookieSession = require('cookie-session');
var requirejs = require('requirejs');
var utils = require('./server/utils');
var pads = require('./server/pads');
var chats = require('./server/chats');
var CronJob = require('cron').CronJob;

var db = require('./server/database').db;
var mail = require('./server/mail');
var path = require('path');
var app = express();

var jwt = require('jsonwebtoken');

var passport = require('passport')
var passportJWT = require("passport-jwt");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var cfg = requirejs('public/js/setup/configs');

var bcrypt = require('bcrypt');

// initialize passport
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = bcrypt.genSaltSync(8);

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
	console.log('payload received', jwt_payload);

	db.collection('users').findOneAsync({ '_id': ObjectId(jwt_payload.id), 'salt': jwt_payload.salt }).then(function (user) {
		console.log('jwt_payload.id', ObjectId(jwt_payload.id));
	  
	  	if (user) {
	  		next(null, user);
	  	} else {
	  		next(null, false);
	  	}
	});
});

passport.use(strategy);

/*passport.serializeUser(function(user, done) {
	done(null, user._id);
});

passport.deserializeUser(function(uid, done) {
	db.collection('users').findOne(done);
});*/

// initialize mail
mail.initializeMail();

// import routes
var users = require('./server/routes/users');
var topics = require('./server/routes/topics');
var groups = require('./server/routes/groups');
var proposals = require('./server/routes/proposals');
var ratings = require('./server/routes/ratings');
var tests = require('./server/routes/tests');

// all environments
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(passport.initialize());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());

var distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// setup cronjob to run every minute
var job = new CronJob({
  cronTime: '*/'+cfg.CRON_INTERVAL+' * * * *',
  onTick: function() {
      topics.manageAndListTopicsAsync().then(function(topics) {
        _.map(topics, mail.sendTopicReminderMessages); // Promise.map does not work above
      });
  },
  start: true
});
job.start();


// ###################
// ### T O P I C S ###
// ###################

/*
Routes plan:

/topiclist - Collection of topics with extended information
/topiclist/:id - Single topic list element with sparse information (currently not used)

/topic - Collection of topics with extended information (currently not used)
/topic:id - Single topic with extended information

*/

function auth() {
  return passport.authenticate('jwt', { session: false });
}

app.get('/json/topics', auth(), topics.list);
app.patch('/json/topic/:id', auth(), topics.update);
app.get('/json/topic/:id', auth(), topics.query);
app.post('/json/topic', auth(), topics.create);
app.delete('/json/topic/:id', auth(), topics.delete);
app.post('/json/topic-vote', auth(), topics.vote);
app.post('/json/topic-unvote', auth(), topics.unvote);
app.get('/file/topic/final/:id', auth(), topics.final);

// #########################
// ### P R O P O S A L S ###
// #########################

app.get('/json/proposal/create/:id', auth(), proposals.create);
app.get('/json/proposal/:id', auth(), proposals.query);

// ###################
// ### G R O U P S ###
// ###################

app.get('/json/groups', auth(), groups.list);
// get group by id
app.get('/json/group/:id', auth(), groups.query);

// #####################
// ### R A T I N G S ###
// #####################

app.get('/json/ratings/count', auth(), ratings.count);
app.get('/json/ratings/:id', auth(), ratings.query);
app.post('/json/ratings/rate', auth(), ratings.rate);

// ###################
// ###   A U T H   ###
// ###################

// authentification
// TODO required?
app.get('/json/auth', users.auth);
// POST /api/auth/login
// @desc: logs in a user
//app.post('/json/auth/login', users.login);
app.post('/json/auth/login', function(req, res) {
  if(req.body.email && req.body.password){
    var email = req.body.email;
    var password = req.body.password;
  }
  
	db.collection('users').findOneAsync({ 'email': email}).then(function (user) {
    if( user == null || _.isUndefined(user) ){
      res.status(401).json({message:"No such user found."});
      return;
    }
    
    if(bcrypt.compareSync(password, user.password)) { // TODO perhaps hash on client side?
      // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
      var payload = { 'id': user._id, 'salt': bcrypt.genSaltSync(8) };
      var token = jwt.sign(payload, jwtOptions.secretOrKey);
      
      db.collection('users').updateAsync({ '_id': user._id }, { $set: { 'salt': payload.salt } }).then(function(user) {
        res.json({ 'message': "Sucessfully logged in.", 'token': token, 'id': user._id });
      }).catch(function(e) {
        if(cfg.DEBUG_CONFIG)
          res.status(500).json({message: JSON.stringify(e)});
        else
          res.status(500).json({message: "Salt could not be updated."});
      });
    } else {
      res.status(401).json({message: "Passwords did not match."});
    }
	});
});

/*app.post('/json/auth/login', passport.authenticate('local', {
  successRedirect: '/topics',
  failureRedirect: '/login'
}));*/
// creates a user
//app.post('/json/auth/signup', users.signup);
app.post('/json/auth/register', function(req, res) {
  if(req.body.email && req.body.password){
    var email = req.body.email;
    var password = req.body.password;
  }
  
  // find user with email, if no user was found, resolve promise (go on with registration)
	db.collection('users').findOneAsync({ 'email': email }).then(function (user) {
    if( !_.isNull(user) ){
      res.status(401).json({ 'message': "User already exists." });
      return Promise.reject();
    }
    
    return Promise.resolve();
	}).then(function() {
    // assemble user
    var user = {
        email: email,
        password: bcrypt.hashSync(password, 8),
        salt: bcrypt.genSaltSync(8),
        verified: false
    };

    // add user to database and return user
    return db.collection('users').insertAsync(user).return(user);
	}).then(function(user) {
    // from now on we'll identify the user by the id and its salt
    // the id and the salt is the personalized value that goes into our token
    var payload = { 'id': user._id, 'salt': user.salt };
    var token = jwt.sign(payload, jwtOptions.secretOrKey);
    res.json({ 'message': "Sucessfully registered", 'token': token, 'id': user._id });
  });

});
// POST /json/auth/logout
// @desc: logs out a user, clearing the signed cookies
app.post('/json/auth/logout', users.logout);
//app.post('/json/auth/logout', auth(), users.logout); //TODO
/*// POST /json/auth/remove_account
// @desc: deletes a user
app.post("/json/auth/remove_account", users.delete );*/
// POST /json/auth/verifyEmail
app.get('/json/auth/verifyEmail/:id', users.verifyEmail);
app.post('/json/auth/verification/:email', users.sendVerificationMailAgain);

// Reset Password and send to user
app.post('/json/auth/password/:email', users.sendPassword);

// ###################
// ###   U S E R   ###
// ###################

// Social
app.get('/json/user/profile/:id', auth(), users.query);
app.get('/json/user/navi', auth(), users.navigation);

// Get and edit own profile
app.get('/json/user/settings/:id', auth(), users.settings);
app.patch('/json/user/settings/:id', auth(), users.update);

// ###################
// ###   T E S T   ###
// ###################

app.get('/test/create_topic_consensus_stage', tests.create_topic_consensus_stage );
app.get('/test/create_topic_proposal_stage', tests.create_topic_proposal_stage );
app.get('/test/create_groups', tests.create_groups );
app.get('/test/remix_groups', tests.remix_groups );
app.get('/test/clean_database', tests.clean_database );

// ########################
// ### Angular handling ###
// ########################

// If a Angular Router path was requested, respond just with index.html
app.all('/*', function(req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', { root: distPath });
    
    // TODO Error handling is necessary if given path is not a route in Angular
});

/*app.use(function(req, res, next){
  // TODO redirect to specific 404 page
  res.redirect(cfg.EVOCRACY_HOST);
});*/

// ###################
// ### S E R V E R ###
// ###################

var httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')(httpServer, {secure: true});
var padServer = pads.startPadServer(io);
var chatServer = chats.startChatServer(io);
