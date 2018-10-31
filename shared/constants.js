const minute = 1000*60;
const hour = 60*minute;

exports.C = {
   MINUTE: minute,
	HOUR: 60*minute,
   DAY: 24*hour,
   
   // Stages 
   STAGE_REJECTED  : -1,
   STAGE_SELECTION :  0,
   STAGE_PROPOSAL  :  1,
   STAGE_CONSENSUS :  2,
   STAGE_PASSED    :  3,
   
   // Rating types 
   RATING_KNOWLEDGE  :  1,
   RATING_INTEGRATION:  2,
   
   // Chat message types
   CHATMSG_DEFAULT: 0,
   CHATMSG_ONLINE: 1,
   CHATMSG_OFFLINE: 2
};
