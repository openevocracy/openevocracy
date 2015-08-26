define([
    'Marionette',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal',
    'controllers/group'
], function(
    Marionette,
    Topics,
    Topic,
    Proposal,
    Group
    ) {

    var topics = new Topics();
    var topic = new Topic();
    var proposal = new Proposal();
    var group = new Group();
    
    var Module = function(module, App) {
        App.router.route('', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topics', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topic/:id', 'topic_index', topic.route_topic_index.bind(topic));
        App.router.route('proposal/:id', 'proposal_index', proposal.route_proposal_index.bind(proposal));
        App.router.route('group/:id', 'group_index', group.route_group_index.bind(group));
    };
    
    return Module;
});