const baseCfg = require("./config.base").base;
const C = require("./constants").C;

// The keys have to be the same as in config.env.dev.js (this is checked in app.js)
exports.cfg = {
	DEBUG : true,
	MAIL_ENABLED:  false,
	CRON_INTERVAL: 1, // run cron every x minute(s)
	ALERT_REMOVAL_TIME:  8000,  // Time after alert is automatically removed (in ms)
	
	MIN_VOTES_PER_TOPIC : 1,
	MIN_GROUPS_PER_TOPIC: 1,
	
	MIN_WORDS_PROPOSAL: 100,
	MIN_WORDS_GROUP   : 100,
	MIN_LETTERS_TOPIC_NAME: 4,
	
	MIN_WORDS_FORUM_COMMENT: 4,
	
	GROUP_SIZE: 5, // Minimum 3
	
	DURATION_SELECTION : 5*C.DAY,
	DURATION_PROPOSAL  : 10*C.DAY,
	DURATION_LEVEL     : 14*C.DAY,
	DURATION_NONE      : -1,
	
	// Time before end
	REMINDER_PROPOSAL_FIRST : 3*C.DAY,
	REMINDER_PROPOSAL_SECOND: C.DAY,
	REMINDER_GROUP_FIRST    : 3*C.DAY,
	REMINDER_GROUP_SECOND   : C.DAY,
	REMINDER_GROUP_LAZY     : 5*C.DAY,
	
	// Date and time format
   DATEFORMAT_DATETIME: baseCfg.DATEFORMAT_DATETIME,
   DATEFORMAT_DATE: baseCfg.DATEFORMAT_DATE,
   DATEFORMAT_TIME: baseCfg.DATEFORMAT_TIME,
	
	PRIVATE: {
		BASE_URL     : baseCfg.BASE_URL,
		DATABASE_HOST: process.env.TEST_DB_URL,
		
		MAIL_HOST  : baseCfg.MAIL_HOST,
		MAIL_PORT  : baseCfg.MAIL_PORT,
		MAIL_SECURE: baseCfg.MAIL_SECURE,
		MAIL_USER  : baseCfg.MAIL_USER,
		MAIL_PASS  : baseCfg.MAIL_PASS,
		MAIL_ADDRESS  : baseCfg.MAIL_ADDRESS
	}
};
