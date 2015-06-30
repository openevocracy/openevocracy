define([
    'Marionette',
    'controllers/login',
    'controllers/register',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal'
], function(
    Marionette,
    Login,
    Register,
    Topics,
    Topic,
    Proposal
    ) {

    var login = new Login();
    var register = new Register();
    var topics = new Topics();
    var topic = new Topic();
    var proposal = new Proposal();
    
    var Module = function(module, App) {
        App.router.route('', 'login_index', login.route_login_index.bind(login)); // TODO use auth handler here
        App.router.route('topics', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topic/:id', 'topic_index', topic.route_topic_index.bind(topic));
        App.router.route('proposal/:id', 'proposal_index', proposal.route_proposal_index.bind(proposal));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
    };
    
    return Module;
    });