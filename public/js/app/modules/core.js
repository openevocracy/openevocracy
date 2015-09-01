define([
    'Marionette',
    'controllers/login',
    'controllers/register',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal',
    'controllers/group'
], function(
    Marionette,
    Login,
    Register,
    Topics,
    Topic,
    Proposal,
    Group
    ) {

    var login = new Login();
    var register = new Register();
    var topics = new Topics();
    var topic = new Topic();
    var proposal = new Proposal();
    var group = new Group();
    
    var Module = function(module, App) {
        App.router.route('', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
        App.router.route('topics', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topic/:id', 'topic_index', topic.route_topic_index.bind(topic));
        App.router.route('proposal/:id', 'proposal_index', proposal.route_proposal_index.bind(proposal));
        App.router.route('group/:id', 'group_index', group.route_group_index.bind(group));
    };
    
    return Module;
});