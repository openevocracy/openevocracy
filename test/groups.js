const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoUnit = require('mongo-unit')
const app = require('../app')

const expect = chai.expect;
chai.use(chaiHttp);

/*
FIXME All tests are broken
because topic_participants is deprecated.
*/

/*
standard test suite
*/
exports.create_topic_consensus_stage = function(req, res) {
    const tid = ObjectId();
    const gid = ObjectId();
    
    const upatrick = ObjectId('56f54aad389ff3b433a212f3');
    const ucarlo = ObjectId('56f54b01389ff3b433a212f4');
    
    // create participants for this topic
    db.collection('topic_participants').insert(
                  [{'tid':tid,'uid':upatrick},
                   {'tid':tid,'uid':ucarlo}],
                  function (){});
    
    // create group
    db.collection('groups').insert({
        '_id': gid,
        'tid': tid,
        'pid': ObjectId(),
        'level': 0
    },function (){});
    
    // create members for this group
    db.collection('group_relations').insert(
                  [{'gid':gid,'uid':upatrick},
                   {'gid':gid,'uid':ucarlo}],
                  function (){});
    
    // create proposals for this group
    db.collection('proposals').insert(
                  [{'tid':tid,'gid':gid,'source':upatrick},
                   {'tid':tid,'gid':gid,'source':ucarlo}],
                  function (){});
    
    res.sendStatus(200);
};

exports.create_topic_proposal_stage = function(req, res) {
    
    // create topic
    const ONE_WEEK = 1000*60*60*24*7; // one week milliseconds
    db.collection('topics').insert({
        '_id': ObjectId(),
        'name': 'ProposalTest'+Date.now(),
        'authorId': ObjectId(req.user._id),
        'pid': ObjectId(),
        'stage': C.STAGE_PROPOSAL,
        'level': 0,
        'nextDeadline': Date.now() + 1000*ONE_WEEK
    }, function (){});
    
    res.sendStatus(200);
};

function fill_topic_participants(tid, num_participants) {
    const topic_participants = [];
    for(const i = 0; i < num_participants; ++i)
        topic_participants.push({'tid':tid,'uid':ObjectId()});
    
    const topic_participants_promise =
        db.collection('topic_participants').insertAsync(topic_participants);
    
    // FIXME must create proposals too!
    //const topic_proposals_promise =
    //    db.collection('proposals').insertAsync(function ()
    
    return topic_participants_promise;
}

function fill_topic_user_ratings(topic) {
    // get all groups of topic with current level
    return db.collection('groups').find(
        {'tid': topic._id, 'level': topic.level}, {'_id': true}).
    // get the corresponding group members
    toArrayAsync().then(function(groups) {
        return db.collection('group_relations').
            find({'gid': { $in: _.pluck(groups,'_id') }}, {'_id': false}).
            toArrayAsync();
    // create a rating for each member
    }).map(function(group_member) {
        return {'ruid': group_member.uid, 'gid': group_member.gid, 'score': 3};
    // insert all ratings into database
    }).then(db.collection('group_ratings').insertAsync.bind(db.collection('group_ratings')));
}

exports.create_groups = function(req, res) {
    Promise.join(db.collection('groups').removeAsync({'tid':tid},true),
                 topics.createGroupsAsync({'_id':tid})).
            then(_.partial(res.sendStatus,200));
};

// see http://stackoverflow.com/a/24660323
/*const promiseWhile = Promise.method(function(condition, action, cond_result) {
    if (!cond_result) return;
    return action().then(condition).then(_.partial(promiseWhile, condition, action, _));
});*/
function promiseWhile(condition, action, cond_result) {
    if (!cond_result) return Promise.resolve();
    return action().then(condition).then(_.partial(promiseWhile, condition, action));
};

/*
test suite for testing of group remix
*/
exports.remix_groups = function(req, res) {
    const response_text = "";
    
    const tid = ObjectId();
    db.collection('topics').insertAsync({
        '_id': tid,
        'name': 'RemixGroupTest'+Date.now(),
        'authorId': ObjectId(req.user._id),
        'pid': ObjectId(),
        'stage': C.STAGE_CONSENSUS,
        'level': 0,
        'nextDeadline': Date.now()}).
    then(_.partial(fill_topic_participants,tid,10)).
    then(_.partial(groups.manage.createGroupsAsync,{'_id':tid})).
    then(_.partial(promiseWhile,
        function condition() {
            return db.collection('topics').findOneAsync({ '_id': tid }, { 'stage': true}).
            then(function (topic) {
                return C.STAGE_CONSENSUS == topic.stage;
            });
        },
        function action() {
            return db.collection('topics').findOneAsync({ '_id': tid })
            .then(function(topic) {return fill_topic_user_ratings(topic).return(topic);})
            .then(_.partial(topics.manageConsensusStage,_,0))
            .then(function(topic) {
                return db.collection('groups').find({ 'tid': tid, 'level': topic.level }).
                toArrayAsync().then(function(groups) {
                    response_text += "<br/>level: " + topic.level + ", number of groups: " + _.size(groups) + ", sizes of each group: ";
                    return groups;
                }).map(function(group) {
                    return db.collection('group_relations').countAsync({'gid': group._id}).
                    then(function(count) {
                        response_text += count + " ";
                    });
                });
            });
        },true)).then(function() {res.status(200).send("<pre>"+response_text+"</pre>");});
};

describe('groups', () => {
	//beforeEach(() => mongoUnit.start());
	//afterEach(() => mongoUnit.drop());

	const topicName = 'testGroupsTopic';	

	let uid, token, topic; 
	before(async () => {
		let res;
		
		// login
		res = await chai.request(app).post('/json/auth/login').send({
			email: 'test@example.com',
			password: 'password'
		});
		console.log(res.body);
		uid = res.body.id;
		token = res.body.token;		
		
		// create topic
		// FIXME need to modify topic deadline
		// idea connect to mongodb URL and modify directly?
		// FIXME topic needs to be in proposal stage
		res = await chai.request(app).post('/json/topic/create').
		set('Authorization', 'JWT ' + token).send({
			name: 'testGroups'
		});
		console.log(res.body);
		topic = res.body;
	});
	
	it('should create 20 proposals', async() => {
		const numProposals = 20;
		for(let i=0; i<numProposals; ++i) {
			res = await chai.request(app).post('/json/topic/proposal/create').
			set('Authorization', 'JWT ' + token).send({
				topicId: topic._id,
				userId: uid
			});
		}
	});
	
	it('should remix groups', async() => {
	    // should be 4 groups
	    //app.
	});
	
	it('should set group user ratings', async() => {
	    // should be 4 groups
	});
});
