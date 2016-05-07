// url: http://alexehrnschwender.com/2013/07/client-side-auth-session-mgmt-backbone-node/
/**
 * Module dependencies.
 */

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
var utils = require('./server/utils');

var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://'+process.env.IP+'/mindabout');
var path = require('path');
var app = express();

// promisify mongoskin
Object.keys(mongoskin).forEach(function(key) {
  var value = mongoskin[key];
  if (typeof value === "function") {
    Promise.promisifyAll(value);
    Promise.promisifyAll(value.prototype);
  }
});
Promise.promisifyAll(mongoskin);

// initilize mail
utils.initializeMail();

// import routes
var users = require('./server/routes/users');
var topics = require('./server/routes/topics');
var groups = require('./server/routes/groups');
var proposals = require('./server/routes/proposals');
var ratings = require('./server/routes/ratings');
var tests = require('./server/routes/tests');
var auth = users.auth_wrapper;

// all environments
app.set('port', process.env.PORT || process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon('public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cookieParser('secret'));
//app.use(cookieSession('secret'));
app.use(session({ secret: 'secret', key: 'uid', cookie: { secure: true }, resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ###################
// ### T O P I C S ###
// ###################

app.get('/json/topics', function(req, res) { auth(req, res, topics.list); });
app.put('/json/topic/:id', function(req, res) { auth(req, res, topics.update); });
app.get('/json/topic/:id', function(req, res) { auth(req, res, topics.query); });
app.post('/json/topic', function(req, res) { auth(req, res, topics.create); });
app.delete('/json/topic/:id', function(req, res) { auth(req, res, topics.delete); });
app.post('/json/topic-vote', function(req, res) { auth(req, res, topics.vote); });
app.post('/json/topic-unvote', function(req, res) { auth(req, res, topics.unvote); });
app.post('/json/topic-join', function(req, res) { auth(req, res, topics.join); });
app.post('/json/topic-unjoin', function(req, res) { auth(req, res, topics.unjoin); });
app.get('/file/topic/final/:id', function(req, res) { auth(req, res, topics.final); } );

// #########################
// ### P R O P O S A L S ###
// #########################

app.get('/json/proposal/:id', function(req, res) { auth(req, res, proposals.query); });

// ###################
// ### G R O U P S ###
// ###################

app.get('/json/groups', function(req, res) { auth(req, res, groups.list); });
// get group by id
app.get('/json/group/:id', function(req, res) { auth(req, res, groups.query); });

// #####################
// ### R A T I N G S ###
// #####################

app.get('/json/ratings/user/count', function(req, res) { auth(req, res, ratings.count_user_rating); });
app.get('/json/ratings/user/:id', function(req, res) { auth(req, res, ratings.query_user_rating); });
app.post('/json/ratings/user/rate', function(req, res) { auth(req, res, ratings.rate_user_rating); });

app.get('/json/ratings/proposal/count', function(req, res) { auth(req, res, ratings.count_proposal_rating); });
app.get('/json/ratings/proposal/:id', function(req, res) { auth(req, res, ratings.query_proposal_rating); });
app.post('/json/ratings/proposal/rate', function(req, res) { auth(req, res, ratings.rate_proposal_rating); });

// ###################
// ###   A U T H   ###
// ###################

// authentification
// TODO required?
app.get("/json/auth", users.auth );
// POST /api/auth/login
// @desc: logs in a user
app.post("/json/auth/login", users.login );
// creates a user
app.post("/json/auth/signup", users.signup );
// POST /json/auth/logout
// @desc: logs out a user, clearing the signed cookies
app.post("/json/auth/logout", users.logout );
/*// POST /json/auth/remove_account
// @desc: deletes a user
app.post("/json/auth/remove_account", users.delete );*/
// POST /json/auth/verifyEmail
app.get("/auth/verifyEmail/:id", users.verifyEmail );

// ###################
// ###   T E S T   ###
// ###################

app.get('/test/create_topic_consensus_stage', tests.create_topic_consensus_stage );
app.get('/test/create_topic_proposal_stage', tests.create_topic_proposal_stage );
app.get('/test/create_groups', tests.create_groups );
app.get('/test/remix_groups', tests.remix_groups );

// ###################
// ### S E R V E R ###
// ###################

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var gulf = require('gulf');
var mongoose = require('mongoose');
var MongoDBAdapter = require('gulf-mongodb');
var ottype = require('rich-text');
var docId;

function gulfIO(masterDoc) {
  var slave = masterDoc.slaveLink();
  
  var streamBuffers = require('stream-buffers');
  var io = require('socket.io')(server, {secure: true});
  io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('delta', function (slaveDelta) {
      var writeableStreamBuffer = new streamBuffers.WritableStreamBuffer({});
      writeableStreamBuffer.on('pipe',function() {
      //slave.on('pipe',function() {
        var masterDelta = writeableStreamBuffer.getContentsAsString();
        console.log(masterDelta);
        if(masterDelta)
          socket.emit('delta',masterDelta);
      });
      
      var readableStreamBuffer = new streamBuffers.ReadableStreamBuffer({});
      //readableStreamBuffer.pipe(slave).pipe(process.stdout);//.pipe(writeableStreamBuffer);
      var s = readableStreamBuffer.pipe(slave);
      s.pipe(writeableStreamBuffer);
      
      readableStreamBuffer.put(JSON.stringify(slaveDelta));
      //readableStreamBuffer.stop();
    });
  });
}

var dbConnection = mongoose.createConnection('mongodb://'+process.env.IP+'/mindabout');
var mongoAdapter = new MongoDBAdapter(dbConnection);
// load or create gulf document
var masterDoc;
gulf.Document.load(mongoAdapter, ottype, docId, function(err, doc) {
  masterDoc = doc;
  if(err)
    gulf.Document.create(mongoAdapter, ottype, 'Hello world!', function(err, doc) {
      masterDoc = doc;
      docId = doc.id;
      gulfIO(masterDoc);
    });
  else
    gulfIO(masterDoc);
});

/*var io = require('socket.io')(server, {secure: true});
var ss = require('socket.io-stream');
io.on('connection', function (socket) {
  socket.on('delta', function (data) {
    console.log(data);
  });
  ss(socket).on('delta', function (stream, data) {
    console.log(data);
    slave.pipe(stream).pipe(slave);
  });
});*/

/*// Set up a server
net.createServer(function(socket) {
    // ... and create a slave link for each socket that connects
    var slave = doc.slaveLink()

    // now, add the new client as a slave
    // of alice's document
    socket.pipe(slave).pipe(socket)
})
// listen for connections
.listen(8081)*/
