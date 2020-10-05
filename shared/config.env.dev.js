const baseCfg = require("./config.base").base;
const C = require("./constants").C;

// The keys have to be the same as in config.env.prod.js (this is checked in app.js)
exports.cfg = {
	DEBUG: true,
	TEST: false,
	MAIL_ENABLED: true,
	CRON_INTERVAL: 1,  // Run cron every x minute(s)
	ALERT_REMOVAL_TIME:  8000,  // Time after alert is automatically removed (in ms)
	CHATROOM_CACHE_TIMEOUT: 1*C.DAY,  // Chat room is removed from cache when it was not called for more than x hours/days
	
	MIN_VOTES_PER_TOPIC : 1,
	MIN_GROUPS_PER_TOPIC: 1,
	
	MIN_WORDS_PROPOSAL: 2,
	MIN_LETTERS_TOPIC_NAME: 4,
	
	MIN_WORDS_FORUM_COMMENT: 4,
	
	GROUP_SIZE: 3, // Minimum 3
	
	DURATION_SELECTION : 0.5*C.MINUTE,
	DURATION_PROPOSAL  : 2*C.MINUTE,
	DURATION_LEVEL     : 2*C.MINUTE,
	DURATION_NONE      : -1,
	
	// Time before end
	REMINDER_PROPOSAL_FIRST : 3*C.MINUTE,
	REMINDER_PROPOSAL_SECOND: 1*C.MINUTE,
	REMINDER_GROUP_FIRST    : 2*C.MINUTE,
	REMINDER_GROUP_SECOND   : 1*C.MINUTE,
	REMINDER_GROUP_LAZY     : 1*C.MINUTE,
	
	// Date and time format
	DATEFORMAT_DATETIME: baseCfg.DATEFORMAT_DATETIME,
	DATEFORMAT_DATE: baseCfg.DATEFORMAT_DATE,
	DATEFORMAT_TIME: baseCfg.DATEFORMAT_TIME,
	
	PRIVATE: {
		BASE_URL     : baseCfg.BASE_URL,
		DATABASE_HOST: 'mongodb://localhost',
		
		MAIL_HOST  : baseCfg.MAIL_HOST,
		MAIL_PORT  : baseCfg.MAIL_PORT,
		MAIL_SECURE: baseCfg.MAIL_SECURE,
		MAIL_USER  : baseCfg.MAIL_USER,
		MAIL_PASS  : baseCfg.MAIL_PASS,
		MAIL_ADDRESS  : baseCfg.MAIL_ADDRESS
	}
};
