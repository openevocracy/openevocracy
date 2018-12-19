const baseCfg = require("./config.base").base;
const C = require("./constants").C;

exports.cfg = {
	DEBUG:         true,
	MAIL_ENABLED:  true,
	CRON_INTERVAL: 1,  // Run cron every x minute(s)
	ALERT_REMOVAL_TIME:  8000,  // Time after alert is automatically removed (in ms)
	
	MIN_VOTES_PER_TOPIC : 1,
	MIN_GROUPS_PER_TOPIC: 1,
	
	MIN_WORDS_PROPOSAL: 2,
	MIN_WORDS_GROUP   : 2,
	MIN_LETTERS_TOPIC_NAME: 4,
	
	GROUP_SIZE: 3, // Minimum 3
	
	DURATION_SELECTION : 99999*C.MINUTE,
	DURATION_PROPOSAL  : 0.75*C.MINUTE,
	DURATION_LEVEL     : 99999*C.MINUTE,
	DURATION_NONE      : -1,
	
	// Time before end
	REMINDER_PROPOSAL_FIRST : C.MINUTE,
	REMINDER_PROPOSAL_SECOND: 1*C.MINUTE,
	REMINDER_GROUP_FIRST    : 2*C.MINUTE,
	REMINDER_GROUP_SECOND   : 1*C.MINUTE,
	REMINDER_GROUP_LAZY     : 1*C.MINUTE,
	
	PRIVATE: {
		BASE_URL     : baseCfg.BASE_URL,
		DATABASE_HOST: 'mongodb://localhost',
		
		MAIL_HOST  : baseCfg.MAIL_HOST,
		MAIL_PORT  : baseCfg.MAIL_PORT,
		MAIL_SECURE: baseCfg.MAIL_SECURE,
		MAIL_USER  : baseCfg.MAIL_USER,
		MAIL_PASS  : baseCfg.MAIL_PASS
	}
};
