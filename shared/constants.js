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
   RATING_KNOWLEDGE  : 1,
   RATING_COOPERATION: 2,
   RATING_ENGAGEMENT:  3,
   
   // Chat message types
   CHATMSG_DEFAULT: 0,
   CHATMSG_ONLINE:  1,
   CHATMSG_OFFLINE: 2,
   
   // Activity types
   ACT_TOPIC_CREATE: 1, // created topic
   ACT_PROPOSAL_CREATED: 2, // created proposal
   ACT_ELECTED_DELEGATE: 3, // was selected as delegate
   ACT_DROP_OUT: 4, // dropped out of group phase
   ACT_TOPIC_COMPLETE: 5, // topic was completed in which the user participated
   ACT_MENTIONED: 6, // the user was mentioned in a group
   ACT_TOPIC_VOTE: 7, // voted for topic
   ACT_TOPIC_UNVOTE: 8 // withdrew vote for topic

};
