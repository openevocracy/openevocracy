var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('../database').db;
var ObjectId = require('mongodb').ObjectID;
var Promise = require('bluebird');
var validate = require('validate.js');

var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwt = require('jsonwebtoken');

var mail = require('../mail');
var utils = require('../utils');

var C = require('../../shared/constants').C;
var cfg = require('../../shared/config').cfg;

// Initialize jwt authentification
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = ((cfg.DEBUG) ? 'debug' : bcrypt.genSaltSync(8));
exports.jwtOptions = jwtOptions;

// User online cache
let onlineUsers = [];

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
	db.collection('users').findOneAsync({ '_id': ObjectId(jwt_payload.id), 'salt': jwt_payload.salt }).then(function (user) {
	  	if (user) {
	  		next(null, user);
	  	} else {
	  		next(null, false);
	  	}
	});
});

exports.getStrategy = function() {
	return strategy;
};

function savePasswordInDatabaseAsync(uid, password) {
    var hash = bcrypt.hashSync(password, 8);
    return db.collection('users').updateAsync({ '_id': uid }, { $set: { 'password': hash } });
}

function getUserByMailAsync(email) {
    return db.collection('users').findOneAsync({'email': email}, {'_id': true, 'email': true, 'lang': true});
}

// POST /api/auth/login
// @desc: logs in a user
exports.login = function(req, res) {
	if(req.body.email && req.body.password) {
		var email = req.body.email;
		var password = req.body.password;
	} else {
		utils.sendAlert(res, 400, 'danger', 'USER_FORM_NOT_FILLED');
		return;
	}
  
	db.collection('users').findOneAsync({ 'email': email}).then(function (user) {
		// If user does not exist
		if(_.isNull(user)) {
			utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', { 'email': email });
			return;
		}
		
		// If user does exist, but is not verified
		if(!_.isNull(user) && !user.verified) {
			utils.sendAlert(res, 401, 'warning', 'USER_ACCOUNT_NOT_VERIFIED', { 'email': user.email });
			return;
		}
	
		// Check if password is correct
		if(bcrypt.compareSync(password, user.password)) { // TODO perhaps hash on client side?
			// From now on we'll identify the user by the id and
			// the id is the only personalized value that goes into our token
			var payload = { 'id': user._id, 'salt': bcrypt.genSaltSync(8) };
			var token = jwt.sign(payload, jwtOptions.secretOrKey);
			
			// Set salt
			db.collection('users').updateAsync({ '_id': user._id }, { $set: { 'salt': payload.salt } }).then(function() {
				res.json({ 'email': user.email, 'token': token, 'id': user._id });
			}).catch(function(e) {
				if(cfg.DEBUG_CONFIG)
					utils.sendAlert(res, 500, 'danger', JSON.stringify(e));
				else
					utils.sendAlert(res, 500, 'danger', 'USER_ACCOUNT_SALT_NOT_UPDATED');
			});
		} else {
			// Passwords did not match
			utils.sendAlert(res, 401, 'danger', 'USER_PASSWORT_NOT_CORRECT', { 'email': email });
		}
	});
};

exports.sendVerificationMailAgain = function(req, res) {
	// Get email from request
	var email = req.body.email;
	
	// Get user id from database
	getUserByMailAsync(email).then(function(user) {
		
		// Break if no user was found
		if(_.isNull(user)) {
			utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', { 'email': email });
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
	mail.sendMailToUser(user,
		'EMAIL_REGISTRATION_SUBJECT', [],
		'EMAIL_REGISTRATION_MESSAGE', [cfg.PRIVATE.BASE_URL, user._id.toString(), user.email]);
}

// @desc: Send a mail containing a new password for the user with the specific email
exports.sendPassword = function(req, res) {
	// Get email from request
	var email = req.body.email;
	
	getUserByMailAsync(email).then(function(user) {
		// Break if no user was found
		if(_.isNull(user)) {
			utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_EMAIL_NOT_EXIST', {'email': email});
			return;
		}
		
		// Generate new password
		var password = Math.random().toString(36).slice(2);
		
		// Send password via email to user
		mail.sendMailToUser(user,
			'EMAIL_PASSWORD_RESET_SUBJECT', [],
			'EMAIL_PASSWORD_RESET_MESSAGE', [password]);
		
		// Save new password in database and send response
		return savePasswordInDatabaseAsync(user._id, password).then(function() {
			utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_PASSWORD_RESET', {'email': email});
		});
	});
};

// @desc: Register a new user
exports.register = function(req, res) {
	var langKey = req.body.lang;
	
	if(req.body.email && req.body.password){
		var email = req.body.email;
		var password = req.body.password;
	} else {
		utils.sendAlert(res, 400, 'danger', 'USER_FORM_NOT_FILLED');
		return;
	}
	
	// Setup parseley
	var constraints = {
		'email': { presence: true, email: true },
		'password': { presence: true, format: /^\S+$/ } // no whitespace
	};
	
	// Read form values
	var form = {'email': email, 'password': password};
	
	// Check if values are valid
	if(!_.isUndefined(validate(form, constraints))) {
		// Values are NOT valid
		utils.sendAlert(res, 400, 'danger', 'USER_FORM_VALIDATION_ERROR');
		return;
	}
	
	// Find user with email, if no user was found, resolve promise (go on with registration)
	db.collection('users').findOneAsync({ 'email': email }).then(function (user) {
		// Check if user already exists
      if(!_.isNull(user)) {
          return utils.rejectPromiseWithAlert(400, 'warning', 'USER_ACCOUNT_ALREADY_EXISTS');
      }
	}).then(function() {
		// Assemble user
		var user = {
			email: email,
			password: bcrypt.hashSync(password, 8),
			salt: bcrypt.genSaltSync(8),
			verified: false,
			lang: langKey
		};
	
		// Add user to database and return user
		return db.collection('users').insertAsync(user).return(user);
	}).then(function(user) {
		// Send email verification link to user
      sendVerificationMail(user);
      
      // Send result to client
      return utils.rejectPromiseWithAlert(200, 'success', 'USER_ACCOUNT_VERIFICATION_LINK_SENT');
	}).catch(utils.isOwnError,utils.handleOwnError(res));  // Handle errors
};

// POST /json/auth/logout
// @desc: logs out a user, deleting the salt for the user's token
exports.logout = function(req, res) {
	var uid = req.body.uid;
	
	// Check if user id was transmitted correctly
	if(_.isUndefined(uid)) {
		utils.sendAlert(res, 400, 'danger', 'USER_ACCOUNT_LOGOUT_ID_MISSING');
		return;
	}
	
	// Get user from user id
	db.collection('users').updateAsync({ '_id': ObjectId(uid) }, { $set: { 'salt': null } }).then(function(user) {
		// Show error if id was wrong and no user was found
		if(_.isNull(user))
			utils.sendAlert(res, 400, 'success', 'USER_ACCOUNT_NOT_EXIST');
		// Just send status 200 if user was found and salt was deleted
		else
			res.send({});
	}).catch(function(e) {
		// If debug: Show detailed error
		if(cfg.DEBUG_CONFIG)
			utils.sendAlert(res, 500, 'success', JSON.stringify(e));
		// If no debug: Just show message that salt could not be deleted
		else
			utils.sendAlert(res, 500, 'success', 'USER_ACCOUNT_LOGOUT_SALT_NOT_DELETED');
	});
};

// POST /json/auth/verifyEmail
exports.verifyEmail = async function(req, res) {
	if(cfg.DEBUG) {
		await db.collection('users').updateAsync(
			{'email': 'test@example.com'}, { $set: { 'verified': true } }, {});
		
		// Update was successful (user was found), send success
		utils.sendAlert(res, 200, 'success', 'USER_ACCOUNT_VERIFICATION_SUCCESS');
		return;
	}
	
	// Get user id from query and store as object id
	try {
		// Try to transform string to object id
		var uid = ObjectId(req.body.uid);
	} catch(error) {
		// If not possible, throw error
		utils.sendAlert(res, 401, 'danger', 'USER_ACCOUNT_VERIFICATION_ERROR');
		return;
	}
	
	// The verification key equals the user id. If the user id (verification key) exists
	// and the 'verified' variable can be set, the user is verified
	db.collection('users').updateAsync(
		{'_id': uid}, { $set: { 'verified': true } }, {}
	).then(function(user) {
		if(user.result.nModified == 0) {
			// If no modification was done, send error message
			utils.sendAlert(res, 401, 'danger', 'USER_ACCOUNT_VERIFICATION_ERROR');
		} else {
			// Update was successful (user was found), send success
			utils.sendAlert(res, 200, 'success', 'USER_ACCOUNT_VERIFICATION_SUCCESS');
		}
	}).catch(function(error) {
		// Something else went wrong, send error directly
		utils.sendAlert(res, 401, 'danger', error);
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
	var userId = ObjectId(req.params.id);
	
	db.collection('users').findOneAsync({'_id': userId},{ 'email':false, 'password':false, 'salt':false })
		.then(res.send.bind(res));
};

// GET /json/user/settings/:id
exports.settings = function(req, res) {
    var userId = ObjectId(req.params.id);
    
    db.collection('users').findOneAsync({'_id': userId},{'email': true})
        .then(res.send.bind(res));
};

// PATCH /json/user/settings/:id
exports.update = function(req, res) {
	var uid = ObjectId(req.params.id);
	var userUpdate = req.body;
	var validation = null;
	
	var emailPromise;
	var passwordPromise;
	  
	// E-mail was updated
	if(_.has(userUpdate, 'email')) {
		// Validate email using parseley
		validation = validate(_.pick(userUpdate, 'email'), { email: { presence: true, email: true } });
		
		if(!_.isUndefined(validation))
			utils.sendAlert(res, 200, 'danger', 'USER_FORM_VALIDATION_ERROR_EMAIL');
		else
			emailPromise = db.collection('users').updateAsync({ '_id': uid }, { $set: _.pick(userUpdate, 'email') });
	       /*.then(function() {
	           utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_EMAIL_UPDATED');
	       });*/
	}
	 
	 // Password was updated
	if(_.has(userUpdate, 'password')) {
		// Validate password using parseley (no whitespace)
		validation = validate(_.pick(userUpdate, 'password'), { 'password': { presence: true, format: /^\S+$/ } });
		
		console.log(userUpdate.password);
		
		if(!_.isUndefined(validation))
			utils.sendAlert(res, 200, 'danger', 'USER_FORM_VALIDATION_ERROR_PASSWORD');
		else
		   passwordPromise = savePasswordInDatabaseAsync(uid, userUpdate.password);/*.then(function() {
		       utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_PASSWORD_UPDATED');
		   });*/
	}
	 
	Promise.all([emailPromise, passwordPromise]).then(function() {
		utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_UPDATED');
	});
};

// GET /json/user/lang/:id
exports.getLanguage = function(req, res) {
	var uid = ObjectId(req.params.id);
	
	db.collection('users')
		.findOneAsync({ '_id': uid },  { 'lang': true })
		.then(res.send.bind(res));
};

// POST /json/user/lang
exports.setLanguage = function(req, res) {
	var uid = ObjectId(req.body.uid);
	var lang = req.body.lang;
	
	db.collection('users')
		.updateAsync({ '_id': uid }, { $set: { 'lang': lang } }).then(function(test) {
			utils.sendAlert(res, 200, 'info', 'USER_ACCOUNT_LANG_UPDATED');
	});
};

// GET /json/user/navi
exports.navigation = function(req, res) {
    var uid = ObjectId(req.user._id);

    var topicsPrePromise = db.collection('topic_proposals').
        find({'source': uid}, {'tid': true}).toArrayAsync().then(function(tids) {
            return db.collection('topics').find({'_id': { $in: _.pluck(tids, 'tid') }},
                {'name': true, 'stage': true, 'level': true, 'nextDeadline': true}).toArrayAsync();
        });
    
    var proposalsPromise = topicsPrePromise.filter(function(topic) {
        return topic.stage == C.STAGE_PROPOSAL;
    }).map(function(topic){
        return db.collection('topic_proposals').
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
        return db.collection('group_relations')
            .find({'uid': uid}, {'gid': true}).toArrayAsync().then(function(group_members) {
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

/*
 * @desc: Authentication for socket connection
 * @params:
 *    ws: socket
 *    userToken: token of user, contains userId and salt
 *    cb: callback function
 */
function socketAuthentication(ws, userToken, cb) {
	// If token was not transmitted, return  and close connection
	if(!userToken) {
		ws.close();
		return;
	}
	
	// Get userToken from client request and decode
	const decodedUserToken = jwt.verify(userToken, jwtOptions.secretOrKey);
	
	// Read userId and salt from decoded token
	const userId = ObjectId(decodedUserToken.id);
	const userSalt = decodedUserToken.salt;
	
	// Check if salt is correct; if yes, connect
	return Promise.resolve(db.collection('users')
		.findOneAsync({'_id': userId}, {'salt': true}).then(function(dbUser) {
			// If salt is not correct, close connection and return
			if (dbUser.salt != userSalt) {
				console.log('Connection rejected, users salt not correct');  // TODO Add to logfile later
				ws.close();
				return;
			}
			
			// Callback
			cb(userId);
	}));
}
exports.socketAuthentication = socketAuthentication;

/*
 * @desc: When user sends feedback, redirect it to feedback@openevocracy.org
 */
exports.sendFeedback = function(req, res) {
	const feedback = req.body.feedback;
	
	// Send mail
	mail.sendMail('feedback@openevocracy.org', 'Evocracy | Feedback Nachricht', feedback);
	
	// Respond with alert
	utils.sendAlert(res, 200, 'success', 'DIALOG_FEEDBACK_SUCESSFULLY_SENT');
};

/**
 * @desc: Enables or disables email notification for an entity (e.g. thread, post) for a specific user
 */
exports.notify = function(req, res) {
	const userId = ObjectId(req.body.userId);
	const entityId = ObjectId(req.body.entityId);
	const status = req.body.status;
	
	// Enable or disable notify and return response
	const notify_promise = (status ? enableEmailNotifyAsync(userId, entityId) : disableEmailNotifyAsync(userId, entityId));
	notify_promise.then(res.send.bind(res));
};

/**
 * @desc: Get status of email notification for an entity (e.g. forum, thread) for a specific user
 * @return: status, which is null (no entry) or boolean (true for enabled, false for disabled)
 **/
function getEmailNotifyStatusAsync(userId, entityId) {
	// Define query
	const query = { 'userId': userId, 'entityId': entityId };
	
	// Get status (null if not exists, true if notify is enabled, false if disabled)
	return db.collection('mail_notify').findOneAsync(query)
		.then(function(notify) {
			return (_.isNull(notify) ? null : notify.status);
	});
}
exports.getEmailNotifyStatusAsync = getEmailNotifyStatusAsync;

/**
 * @desc: Enables email notification for an entity (e.g. forum, thread) for a specific user
 * 		  If notification does not exist, create entry in database
 */
function enableEmailNotifyAsync(userId, entityId) {
	// Define query
	const query = { 'userId': userId, 'entityId': entityId };
	
	// If exists, set enable notifications, otherwise, add entry to collection
	return db.collection('mail_notify')
		.updateAsync(query, { $set: { 'status': true } }, { 'upsert': true });
}
exports.enableEmailNotifyAsync = enableEmailNotifyAsync;

/**
 * @desc: Disable email notification for an entity (e.g. forum, thread) for a specific user
 */
function disableEmailNotifyAsync(userId, entityId) {
	// Define query
	const query = { 'userId': userId, 'entityId': entityId };
	
	// Disable email notifications
	return db.collection('mail_notify')
		.updateAsync(query, { $set: { 'status': false } });
}
exports.disableEmailNotifyAsync = disableEmailNotifyAsync;

/**
 * @desc: Gets all user ids which should be notified for a specific entity (like thread or forum)
 */
exports.getNotifyUserIdsForEntity = function(entityId) {
	// Get user ids, given entity ids
	return db.collection('mail_notify')
		.find({'entityId': entityId}, {'_id': false, 'userId': true}).toArrayAsync()
		.map(function(notify) { return notify.userId; });
};

/**
 * @desc: Create socket to monitor if connection to clients is alive via ping pong
 */
exports.startAliveServer = function(wss, websockets) {
	// Initialize stream and listener for WebSocket server
	wss.on('connection', function(ws, req) {
		// Get user token from websocket url
		const userToken = req.url.split("/socket/alive/")[1];
		
		// Authenticate user and initialize ping pong
		socketAuthentication(ws, userToken, function(userId) {
			// Add user to online list
			onlineUsers.push(userId);
			
			// Set socket alive initially and every time a pong is arriving from client
			ws.isAlive = true;
			ws.on('pong', function() {
				ws.isAlive = true;
			});
			
			// On close, terminate connection
			ws.on('close', function() {
				terminateUserConnections(websockets, userId);
			});
			
			// On ping from client, respond with pong
			ws.on('message', function(msg) {
				if(msg == 'ping') {
					ws.send('pong');
				}
			});
			
			// Initalize ping interval
			pingInterval(wss, websockets);
		});
	});
	
	// TODO
	// * Use pingIntervall function for wssAlive, but terminate ALL websockets (wssChat, wssPad, wssAlive), if client does not answer
	// * Bind userId to every socket ws (like ws.userId = ...) to be able to filter out websockets to close
	// * Shift pingIntervall to users file
	// * Remove ping/pong from pads and chats
	// * Create a list with all users which are connected and alive, remove users which went offline or did not respond anymore (on disconnect and if not alive anymore)
};

// TODO Remove utils.pingInterval
function pingInterval(wssAlive, websockets) {
	setInterval(function() {
		// Send ping to every client
		wssAlive.clients.forEach(function(ws) {
			// Get user id of current websocket connection
			const userId = ws.userId;
			// If websocket is still not alive after 30 seconds, close all websockets
			if (!ws.isAlive) {
				// Terminate all other websockets (wssPad, wssChat) using userId and remove user from online list
				terminateUserConnections(websockets, userId);
				
				// Finally terminate wssAlive websocket and return
				return ws.terminate();
			}
			
			// Set isAlive to false and ping client again
			ws.isAlive = false;
			ws.ping(function() {});
			// If the client responds within 30 seconds, the isAlive status is reset to true
		});
	}, 30000);
}

/**
 * @desc: Shut down websocket connections and remove user from online list
 */
function terminateUserConnections(websockets, userId) {
	// Shut down websocket connections
	websockets.forEach(function(wss) {
		// Find connection which is dead using userId
		const wsConnection = utils.findWhereObjectId(wss.clients, {'userId': userId});
		// Terminate if connection was found
		if (wsConnection) {
			const terminated = wsConnection.terminate();
			console.log('terminated', terminated);
		}
	});
	
	// Remove user from online list
	onlineUsers = utils.withoutObjectId(onlineUsers, userId);
}
