var Promise = require('bluebird');
var favicon = require('serve-favicon');
var session = require('express-session')
var multer = require('multer');
var errorHandler = require('errorhandler');
var utils = require('./server/utils');
var db = require('./server/database').db;


var _ = require('underscore');
var express = require('express');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var http = require('http');
var chats = require('./server/chats');
var CronJob = require('cron').CronJob;

var mail = require('./server/mail');
var path = require('path');
var app = express();

var passport = require('passport');

var cfg = require('./shared/config').cfg;

// Initalize mail
mail.initializeMail();

// Import routes
var users = require('./server/routes/users');
var topics = require('./server/routes/topics');
var groups = require('./server/routes/groups');
var proposals = require('./server/routes/proposals');
var ratings = require('./server/routes/ratings');
var tests = require('./server/routes/tests');
var pads = require('./server/routes/pads');

// Set passport strategy
var strategy = users.getStrategy();
passport.use(strategy);

// All express environments
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

// Setup cronjob to run every minute
var job = new CronJob({
	cronTime: '*/'+cfg.CRON_INTERVAL+' * * * *',
	onTick: function() {
		topics.manageAndListTopicsAsync().then(function(topics) {
			// FIXME: An error could occur if i18n and mail initialization is not ready when cronjob runs for the first time
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

app.get('/json/topiclist', auth(), topics.list);
app.patch('/json/topic/:id', auth(), topics.update);
app.get('/json/topic/:id', auth(), topics.query);
app.post('/json/topic', auth(), topics.create);
app.delete('/json/topic/:id', auth(), topics.delete);
app.post('/json/topic-vote', auth(), topics.vote);
app.post('/json/topic-unvote', auth(), topics.unvote);
app.get('/file/topic/final/:id', auth(), topics.final);

// ###################
// ### E D I T O R ###
// ###################

// @desc: Get detailed information about topic description pad
app.get('/json/topic/editor/:id', auth(), pads.getPadTopicDetails);

// @desc: Get detailed information about proposal pad
app.get('/json/proposal/editor/:id', auth(), pads.getPadProposalDetails);

// @desc: Get detailed information about group pad
app.get('/json/group/editor/:id', auth(), groups.query);

// #########################
// ### P R O P O S A L S ###
// #########################

app.post('/json/proposal/create', auth(), proposals.create);
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

// @desc: Store a new rating value
app.post('/json/ratings/rate', auth(), ratings.rate);

// ###################
// ###   A U T H   ###
// ###################

// @desc: Logs in a user
app.post('/json/auth/login', users.login);

// @desc: Creates a user while registration
app.post('/json/auth/register', users.register);

// @desc: Logs out a user and clears the salt in database
app.post('/json/auth/logout', auth(), users.logout);

// @desc: Deletes a user
//app.post("/json/auth/remove_account", users.delete);

// @desc: Verifies email address (if users clicks on verification link)
app.post('/json/auth/verifyEmail', users.verifyEmail);

// @desc: Resends verification link via email
app.post('/json/auth/verification', users.sendVerificationMailAgain);

// @desc: Resets password and send an email to user (password forget functionality)
app.post('/json/auth/password', users.sendPassword);

// ###################
// ###   U S E R   ###
// ###################

// Social
app.get('/json/user/profile/:id', auth(), users.query);
app.get('/json/user/navi', auth(), users.navigation);

// @desc: Get settings form values from specific user in order to edit them
app.get('/json/user/settings/:id', auth(), users.settings);

// @desc: Patch new user settings
app.patch('/json/user/settings/:id', auth(), users.update);

// @desc: Get user language
app.get('/json/user/lang/:id', auth(), users.getLanguage);

// @desc: Store chosen user language in databse for email translation
app.post('/json/user/lang', auth(), users.setLanguage);

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

app.use(express.static('node_modules/quill/dist'));

var WebSocket = require('ws');

var httpServer = http.createServer(app);

httpServer.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

var wssPad = new WebSocket.Server({ noServer: true });
var wssChat = new WebSocket.Server({ noServer: true });

pads.startPadServer(wssPad);
chats.startChatServer(wssChat);

httpServer.on('upgrade', function upgrade(request, socket, head) {
	var queryArr = request.url.split("/socket/")[1].split("/");
	var connectionType = queryArr[0];

	if (connectionType === 'pad') {
		wssPad.handleUpgrade(request, socket, head, function done(ws) {
			wssPad.emit('connection', ws, request);
		});
	} else if (connectionType === 'chat') {
		wssChat.handleUpgrade(request, socket, head, function done(ws) {
			wssChat.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});

//var wss = new WebSocket.Server({'server': httpServer});

