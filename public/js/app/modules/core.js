define([
    'Marionette',
    'handlebars',
    'controllers/login',
    'controllers/register',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal',
    'controllers/group',
    'text!partials/views/header.html',
    'text!partials/views/buttons.html',
    'text!partials/views/messages.html',
    'text!partials/blocks/topic_statistics.html',
    'text!partials/blocks/topic_tabs.html',
    'text!partials/blocks/topic_author.html'
], function(
    Marionette,
    Handlebars,
    Login,
    Register,
    Topics,
    Topic,
    Proposal,
    Group,
    HeaderPartial,
    ButtonsPartial,
    MessagesPartials,
    StatBlockPartials,
    TopicTabsBlockPartials,
    TopicAuthorBlockPartials
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
    
    Handlebars.registerPartial('header', HeaderPartial);
    Handlebars.registerPartial('buttons', ButtonsPartial);
    Handlebars.registerPartial('messages', MessagesPartials);
    Handlebars.registerPartial('topic_statistics', StatBlockPartials);
    Handlebars.registerPartial('topic_tabs', TopicTabsBlockPartials);
    Handlebars.registerPartial('topic_author', TopicAuthorBlockPartials);
    
    return Module;
});