const _ = require('underscore');
const express = require('express');
const logger = require('morgan');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const http = require('http');
const chats = require('./server/chats');
const CronJob = require('cron').CronJob;

const mail = require('./server/mail');
const path = require('path');
const app = express();

const passport = require('passport');

const cfg = require('./shared/config').cfg;

// Initalize mail
mail.initializeMail();

// Import routes
const utils = require('./server/utils');
const users = require('./server/routes/users');
const topics = require('./server/routes/topics');
const groups = require('./server/routes/groups');
const forums = require('./server/routes/forums');
const tests = require('./server/routes/tests');
const pads = require('./server/routes/pads');
const activities = require('./server/routes/activities');
const socialnet = require('./server/routes/socialnet');

// Set passport strategy
const strategy = users.getStrategy();
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

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Setup cronjob to run every minute
const job = new CronJob({
	cronTime: '*/'+cfg.CRON_INTERVAL+' * * * *',
	onTick: function() {
		topics.manage.manageAndListTopicsAsync().then(function(topics) {
			// FIXME: An error could occur if i18n and mail initialization is not ready when cronjob runs for the first time
			_.map(topics, mail.sendTopicReminderMessages); // Promise.map does not work above
		});
	},
	start: true
});
job.start();

function auth() {
	return passport.authenticate('jwt', { session: false });
}

// Check if config.env.* contain the same variables
utils.checkConfig();

// ###################
// ### T O P I C S ###
// ###################

/*
 * Routes:
 *
 * /topiclist - Collection of topics with extended information
 * /topiclist/:id - Single topic list element with sparse information (currently not used)
 *
 * /topic - Collection of topics with extended information (currently not used)
 * /topic:id - Single topic with extended information
 */

/* Topic List */
 
app.get('/json/topiclist', auth(), topics.manage.getTopiclist);
app.get('/json/topiclist/:id', auth(), topics.manage.getTopiclistElement);

/* Topic */
 
//app.get('/json/topic/:id', auth(), topics.manage.query);
app.post('/json/topic/create', auth(), topics.manage.create);
app.patch('/json/topic/:id', auth(), topics.manage.update);
app.delete('/json/topic/:id', auth(), topics.manage.delete);

// Manage topic before getting any information and return basic topic data
app.get('/json/topic/basic/:id', auth(), topics.query.basic);

// Get topic toolbar data
app.get('/json/topic/toolbar/:id', auth(), topics.query.toolbar);

// Get topic overview data
app.get('/json/topic/overview/:id', auth(), topics.query.overview);

// @desc: Vote and unvote for specific topic from specific user
app.post('/json/topic-vote', auth(), topics.manage.vote);
app.post('/json/topic-unvote', auth(), topics.manage.unvote);

// @desc: Download final document as pdf
app.get('/file/topic/:id', auth(), topics.manage.download);

/* Proposal */

// @desc: Create new proposal
app.post('/json/topic/proposal/create', auth(), topics.proposals.create);

// @desc: Get proposal doc for editor and html snapshot
app.get('/json/topic/proposal/:id', auth(), topics.query.proposal);

// @desc: Get detailed information about proposal pad
//app.get('/json/proposal/editor/:id', auth(), pads.getPadProposalDetails);

// @desc: Get proposal information
//app.get('/json/proposal/view/:id', auth(), pads.getPadProposalView);

// ###########################
// ### A C T I V I T I E S ###
// ###########################

/*
 * Routes:
 *
 * /activitylist - Collection of activities
 *
 * /activity - Collection of topics with extended information (currently not used)
 * /activity:id - Single topic with extended information
 */

/*
 * @desc: Get whole activity list
 */
//app.get('/json/activitylist', auth(), activities.getActivityList);

/*
 * @desc: Get a user's activity list
 */
app.get('/json/user/activitylist/:id', auth(), activities.getUserActivityList);

/*
 * @desc: Get the length of a user's activity list
 */
app.get('/json/user/activitylistlength/:id', auth(), activities.getUserActivityListLength);

/*
 * @desc: Get, create and delete activities
 */
app.get('/json/activity/:id', auth(), activities.query);
app.post('/json/activity/create', auth(), activities.create);
//app.delete('/json/activity/:id', auth(), activities.delete); //activities are now only deleted by the server

// #########################
// ### S O C I A L N E T ### // TODO
// #########################

/*
 * Routes:
 *
 * /follow - user follows another user
 * /unfollow - user stops to follows another user
 * /materequest - user sends a request to be mates with another user
 * /unmate - user ends mate relation


// ###############
// ### D O C S ###
// ###############

// @desc: Get detailed information about topic description pad
app.get('/json/topic/editor/:id', auth(), pads.getPadTopicDetails);

// ##################
// ### G R O U P  ###
// ##################

// @desc: Get detailed information about group pad
//app.get('/json/group/editor/:id', auth(), groups.query.editor);

// @desc: Get group information
app.get('/json/group/view/:id', auth(), pads.getPadGroupView);

// @desc: Group main toolbar with topic and group title
app.get('/json/group/badges/:id', auth(), groups.query.badges);

// @desc: Group online status of members
app.get('/json/group/membersonline/:id', auth(), groups.query.onlineMembers);

// @desc: Group members, including ratings and previous documents
app.get('/json/group/basic/:id', auth(), groups.query.getBasicGroup);

/* Forum */

// @desc: Vote for entity (post or comment)
app.post('/json/group/forum/vote', auth(), forums.misc.vote);

// @desc: Get group forum
app.get('/json/group/forum/:id', auth(), forums.forum.query);

// @desc: Get thread
app.get('/json/group/forum/thread/:id', auth(), forums.thread.query);

// @desc: Create new thread in forum
app.post('/json/group/forum/thread/create', auth(), forums.thread.create);

// @desc: Edit thread in forum
app.patch('/json/group/forum/thread/:id', auth(), forums.thread.edit);

// @desc: Delete thread in forum
app.delete('/json/group/forum/thread/:id', auth(), forums.thread.delete);

// @desc: Update solved state of thread
app.post('/json/group/forum/thread/solved', auth(), forums.thread.updateSolved);

// @desc: Create new post in forum thread
app.post('/json/group/forum/post/create', auth(), forums.post.create);

// @desc: Edit post in forum thread
app.patch('/json/group/forum/post/:id', auth(), forums.post.edit);

// @desc: Delete post in forum thread
app.delete('/json/group/forum/post/:id', auth(), forums.post.delete);

// @desc: Create new comment for post in forum thread
app.post('/json/group/forum/comment/create', auth(), forums.comment.create);

// @desc: Edit comment in forum thread
app.patch('/json/group/forum/comment/:id', auth(), forums.comment.edit);

// @desc: Delete comment in forum thread
app.delete('/json/group/forum/comment/:id', auth(), forums.comment.delete);

/* Chat */

// @desc: Get chat room
app.get('/json/chat/room/:id', auth(), chats.queryChatRoomMessages);

// @desc: Send mail to all mentioned users
app.post('/json/chat/mentioned/', auth(), chats.processMentionedUsers);

/* Ratings */

app.get('/json/group/ratings/:id', auth(), groups.ratings.getMembersRatings);

// @desc: Store a new rating value
app.post('/json/ratings/rate', auth(), groups.ratings.rate);

/* Group vis */

// @desc: Get group vis data to visualize topic hierarchy
app.get('/json/groupvis/:id', auth(), groups.groupvis.query);

// @desc: Get details about specific proposal
app.get('/json/groupvis/proposal/:id', auth(), groups.groupvis.getProposal);

// @desc: Get details about specific group
app.get('/json/groupvis/group/:id', auth(), groups.groupvis.getGroup);

/* Welcome dialog */

// @desc: Get welcome dialog status (already opened or not)
app.get('/json/group/welcome/status/:id', auth(), groups.welcome.getWelcomeStatus);

// @desc: Set welcome dialog status (already opened or not)
app.post('/json/group/welcome/status', auth(), groups.welcome.setWelcomeStatus);

// @desc: Get all information about group welcome dialog
app.get('/json/group/welcome/:id', auth(), groups.welcome.getWelcomeData);

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
// ###   M I S C   ###
// ###################

// @desc: Config file
app.get('/json/config', utils.config);

// @desc: Ping server for connection test
//app.get('/json/ping', utils.ping);

// @desc: User feedback
app.post('/json/feedback', auth(), users.sendFeedback);

// @desc: Enable/Disable email notifications for user
app.post('/json/notify', auth(), users.notify);

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

// ###################
// ### S E R V E R ###
// ###################

// Show unhandled rejection error (UnhandledPromiseRejectionWarning)
process.on('unhandledRejection', (reason, p) => {
	console.log('UnhandledPromiseRejectionWarning at ', reason);
});

// Is this necessary?
app.use(express.static('node_modules/quill/dist'));

var WebSocket = require('ws');
var httpServer = http.createServer(app);

httpServer.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

let wssPad = new WebSocket.Server({ noServer: true });
let wssChat = new WebSocket.Server({ noServer: true });
let wssAlive = new WebSocket.Server({ noServer: true });
let wssBadge = new WebSocket.Server({ noServer: true });

pads.startPadServer(wssPad);
chats.startChatServer(wssChat);
groups.badges.startGroupBadgeServer(wssBadge);
users.startAliveServer(wssAlive, [wssPad, wssChat]);

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
	} else if (connectionType === 'badge') {
		wssBadge.handleUpgrade(request, socket, head, function done(ws) {
			wssBadge.emit('connection', ws, request);
		});
	} else if (connectionType === 'alive') {
		wssAlive.handleUpgrade(request, socket, head, function done(ws) {
			wssAlive.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});

//var wss = new WebSocket.Server({'server': httpServer});

module.exports = app;
