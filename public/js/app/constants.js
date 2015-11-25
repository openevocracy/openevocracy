// Stages
var ONE_WEEK = 1000*60*60*24*7;

define({
    DEBUG                     : true,
    MIN_PARTICIPANTS_PER_TOPIC: 2,
    
    DEADLINE_SELECTION: ONE_WEEK,
    DEADLINE_PROPOSAL : ONE_WEEK,
    DEADLINE_LEVEL    : ONE_WEEK,
    DEADLINE_NONE     : -1,
    
    STAGE_REJECTED  : -1,
    STAGE_SELECTION :  0,
    STAGE_PROPOSAL  :  1,
    STAGE_CONSENSUS :  2,
    STAGE_PASSED    :  3
});