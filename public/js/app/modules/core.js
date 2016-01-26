define([
    'Marionette',
    'handlebars',
    'controllers/login',
    'controllers/register',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal',
    'controllers/group',
    'text!templates/partials/views/header.html',
    'text!templates/partials/views/buttons.html',
    'text!templates/partials/views/messages.html',
    'text!templates/partials/views/lightbox.html',
    'text!templates/partials/blocks/topic_statistics.html',
    'text!templates/partials/blocks/topic_tabs.html',
    'text!templates/partials/blocks/topic_author.html',
    'text!templates/partials/blocks/topic_final.html',
    'text!templates/partials/blocks/group_tabs.html',
    'text!templates/partials/blocks/group_proposals.html',
    'text!templates/partials/blocks/proposal_tabs.html'
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
    LightboxPartials,
    StatBlockPartials,
    TopicTabsBlockPartials,
    TopicAuthorBlockPartials,
    TopicFinalBlockPartials,
    GroupTabsBlockPartials,
    GroupProposalsBlockPartials,
    ProposalTabsBlockPartials
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
    Handlebars.registerPartial('lightbox', LightboxPartials);
    Handlebars.registerPartial('topic_statistics', StatBlockPartials);
    Handlebars.registerPartial('topic_tabs', TopicTabsBlockPartials);
    Handlebars.registerPartial('topic_author', TopicAuthorBlockPartials);
    Handlebars.registerPartial('topic_final', TopicFinalBlockPartials);
    Handlebars.registerPartial('group_tabs', GroupTabsBlockPartials);
    Handlebars.registerPartial('group_proposals', GroupProposalsBlockPartials);
    Handlebars.registerPartial('proposal_tabs', ProposalTabsBlockPartials);
    
    return Module;
});