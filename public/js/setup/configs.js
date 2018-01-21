/* system values, later mainly replaced by user values or user means */
var DISABLED = -1;
var ONE_DAY = 1000*60*60*24;
var ONE_MIN = 1000*60;

var EVOCRACY_HOST = 'http://178.63.84.211:3000';
var DATABASE_HOST = 'mongodb://127.0.0.1/evocracy';

var DEBUG_CONFIG = {
    DEBUG: false,
    MAIL: false,
    CRON_INTERVAL: 1, // run cron every x minute(s)
    
    MIN_VOTES_PER_TOPIC : 1,
    MIN_GROUPS_PER_TOPIC: 1,
    
    MIN_WORDS_PROPOSAL: 2,
    
    GROUP_SIZE: 3, // Minimum 3
    
    DURATION_SELECTION : 9999*ONE_MIN,
    DURATION_PROPOSAL  : 1*ONE_MIN,
    DURATION_LEVEL     : 1*ONE_MIN,
    DURATION_NONE      : -1,
    
    // Time before end
    REMINDER_PROPOSAL_FIRST : ONE_MIN,
    REMINDER_PROPOSAL_SECOND: 1*ONE_MIN,
    REMINDER_GROUP_FIRST    : 2*ONE_MIN,
    REMINDER_GROUP_SECOND   : 1*ONE_MIN,
    REMINDER_GROUP_LAZY     : 1*ONE_MIN,
    
    EVOCRACY_HOST : EVOCRACY_HOST,
    DATABASE_HOST : DATABASE_HOST
};

var RELEASE_CONFIG = {
    DEBUG : true,
    MAIL: true,
    CRON_INTERVAL: 1, // run cron every x minute(s)
    
    MIN_VOTES_PER_TOPIC : 1,
    
    MIN_WORDS_PROPOSAL: 100,
    MIN_WORDS_GROUP   : 100,
    
    GROUP_SIZE: 5, // Minimum 3
    
    DURATION_SELECTION : 5*ONE_DAY,
    DURATION_PROPOSAL  : 10*ONE_DAY,
    DURATION_LEVEL     : 14*ONE_DAY,
    DURATION_NONE      : -1,
    
    // Time before end
    REMINDER_PROPOSAL_FIRST : 3*ONE_DAY,
    REMINDER_PROPOSAL_SECOND: ONE_DAY,
    REMINDER_GROUP_FIRST    : 3*ONE_DAY,
    REMINDER_GROUP_SECOND   : ONE_DAY,
    REMINDER_GROUP_LAZY     : 5*ONE_DAY,
    
    EVOCRACY_HOST : EVOCRACY_HOST,
    DATABASE_HOST : DATABASE_HOST
};

define(DEBUG_CONFIG);
//define(RELEASE_CONFIG);