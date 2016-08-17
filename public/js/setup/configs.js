/* system values, later mainly replaced by user values or user means */
var ONE_DAY = 1000*60*60*24;

define({
    DEBUG : true,
    MAIL: true,
    
    MIN_PARTICIPANTS_PER_TOPIC : 2,
    
    LIMIT_SELECTION: 1, // default 20
    
    DURATION_SELECTION : 5*ONE_DAY,
    DURATION_PROPOSAL  : 10*ONE_DAY,
    DURATION_LEVEL     : 14*ONE_DAY,
    DURATION_NONE      : -1,
    
    EVOCRACY_HOST : 'https://mind-about-sagacitysite.c9.io',
    ETHERPAD_HOST : 'https://beta.etherpad.org/p/'
});

