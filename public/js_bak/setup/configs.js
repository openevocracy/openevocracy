/* system values, later mainly replaced by user values or user means */
var DISABLED = -1;
var ONE_DAY = 1000*60*60*24;
var ONE_MIN = 1000*60;

var DEBUG_CONFIG = {
    DEBUG: true,
    MAIL: false,
    CRON_INTERVAL: 1, // run cron every x minute(s)
    
    MIN_VOTES_PER_TOPIC: 1,
    MIN_GROUPS_PER_TOPIC: 1,
    
    MIN_WORDS_PROPOSAL: 2,
    
    GROUP_SIZE: 3,
    
    DURATION_SELECTION : 2*ONE_MIN,
    DURATION_PROPOSAL  : 3*ONE_MIN,
    DURATION_LEVEL     : 5*ONE_MIN,
    DURATION_NONE      : -1,
    
    // Time before end
    REMINDER_PROPOSAL_FIRST : DISABLED,
    REMINDER_PROPOSAL_SECOND: DISABLED,
    REMINDER_GROUP_FIRST    : DISABLED,
    REMINDER_GROUP_SECOND   : DISABLED,
    REMINDER_GROUP_LAZY     : DISABLED,
    REMINDER_GROUP_RATING   : DISABLED,
    
    EVOCRACY_HOST : 'https://mind-about-sagacitysite.c9.io'
};

var RELEASE_CONFIG = {
    DEBUG : true,
    MAIL: true,
    CRON_INTERVAL: 1, // run cron every x minute(s)
    
    MIN_VOTES_PER_TOPIC: 1,
    MIN_GROUPS_PER_TOPIC: 1,
    
    MIN_WORDS_PROPOSAL: 100,
    
    GROUP_SIZE: 5,
    
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
    
    EVOCRACY_HOST : 'https://mind-about-sagacitysite.c9.io'
};

define(DEBUG_CONFIG);
//define(RELEASE_CONFIG);