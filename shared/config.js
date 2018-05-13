var DISABLED = -1;
var ONE_DAY = 1000*60*60*24;
var ONE_MIN = 1000*60;

var EVOCRACY_HOST = 'http://178.63.84.211:8100';
var BASE_URL = 'https://develop.openevocracy.org';
var DATABASE_HOST = 'mongodb://127.0.0.1/evocracy';

var DEBUG_CONFIG = {
    DEBUG:         true,
    MAIL:          false,
    CRON_INTERVAL: 1,  // Run cron every x minute(s)
    ALERT_REMOVAL_TIME:  8000,  // Time after alert is automatically removed (in ms)
    
    MIN_VOTES_PER_TOPIC : 1,
    MIN_GROUPS_PER_TOPIC: 1,
    
    MIN_WORDS_PROPOSAL: 2,
    MIN_WORDS_GROUP   : 2,
    MIN_LETTERS_TOPIC_NAME: 4,
    
    GROUP_SIZE: 3, // Minimum 3
    
    DURATION_SELECTION : 99999*ONE_MIN,
    DURATION_PROPOSAL  : 9999*ONE_MIN,
    DURATION_LEVEL     : 99999*ONE_MIN,
    DURATION_NONE      : -1,
    
    // Time before end
    REMINDER_PROPOSAL_FIRST : ONE_MIN,
    REMINDER_PROPOSAL_SECOND: 1*ONE_MIN,
    REMINDER_GROUP_FIRST    : 2*ONE_MIN,
    REMINDER_GROUP_SECOND   : 1*ONE_MIN,
    REMINDER_GROUP_LAZY     : 1*ONE_MIN,
    
    BASE_URL : BASE_URL,
    EVOCRACY_HOST : EVOCRACY_HOST,
    DATABASE_HOST : DATABASE_HOST
};

var RELEASE_CONFIG = {
    DEBUG : false,
    MAIL: true,
    CRON_INTERVAL: 1, // run cron every x minute(s)
    ALERT_REMOVAL_TIME:  8000,  // Time after alert is automatically removed (in ms)
    
    MIN_VOTES_PER_TOPIC : 1,
    
    MIN_WORDS_PROPOSAL: 100,
    MIN_WORDS_GROUP   : 100,
    MIN_LETTERS_TOPIC_NAME: 4,
    
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
    
    BASE_URL : BASE_URL,
    EVOCRACY_HOST : EVOCRACY_HOST,
    DATABASE_HOST : DATABASE_HOST
};

exports.cfg = DEBUG_CONFIG;
