/* system values, later mainly replaced by user values or user means */
var ONE_DAY = 1000*60*60*24;
var ONE_MIN = 1000*60;

var DEBUG_CONFIG = {
    DEBUG: true,
    MAIL: false,
    
    MIN_VOTES_PER_TOPIC: 1,
    MIN_GROUPS_PER_TOPIC: 1,
    
    MIN_WORDS_PROPOSAL: 2,
    
    DURATION_SELECTION : 0.25*ONE_MIN,
    DURATION_PROPOSAL  : 0.25*ONE_MIN,
    DURATION_LEVEL     : 15*ONE_MIN,
    DURATION_NONE      : -1,
    
    // Time before end
    REMINDER_PROPOSAL_FIRST : 5*ONE_MIN,
    REMINDER_PROPOSAL_SECOND: 1*ONE_MIN,
    REMINDER_GROUP_FIRST    : 7*ONE_MIN,
    REMINDER_GROUP_SECOND   : 3*ONE_MIN,
    REMINDER_GROUP_LAZY     : 10*ONE_MIN,
    
    EVOCRACY_HOST : 'https://mind-about-sagacitysite.c9.io'
};

var RELEASE_CONFIG = {
    DEBUG : true,
    MAIL: true,
    
    MIN_PARTICIPANTS_PER_TOPIC: 20,
    MIN_GROUPS_PER_TOPIC: 2,
    
    MIN_WORDS_PROPOSAL: 100,
    
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