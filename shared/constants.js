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
   
   // Social network relations
   SN_DEFAULT: 0, // no special relation to another user
   SN_FOLLOWER: 1, // follower of another user
   SN_MATE: 2, // mate of another user
   
   // Activity types
   ACT_TOPIC_CREATE: 1, // created topic
   ACT_PROPOSAL_CREATED: 2, // created proposal
   ACT_ELECTED_DELEGATE: 3, // was selected as delegate
   ACT_DROP_OUT: 4, // dropped out of group phase
   ACT_TOPIC_COMPLETE: 5, // topic was completed in which the user participated
   ACT_MENTIONED: 6, // the user was mentioned in a group
   ACT_TOPIC_VOTE: 7, // voted for topic
   ACT_TOPIC_UNVOTE: 8, // withdrew vote for topic
   ACT_FOLLOW: 9, // now follows a user
   ACT_MATE: 10, // is now the mate of a user
   
   // Activity privacy levels
   ACT_PLVL_ALL: 0, // activity visible to all
   ACT_PLVL_FOLLOWERS_MATES: 1, // activity visible to followers & mates
   ACT_PLVL_MATES: 2, // activity visible to mates only
   ACT_PLVL_SELF: 3 // activity visible to user themself only
};
