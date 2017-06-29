define([
    'Marionette',
    'handlebars',
    'controllers/login',
    'controllers/register',
    'controllers/navigation',
    'controllers/user',
    'controllers/settings',
    'controllers/topics',
    'controllers/topic',
    'controllers/proposal',
    'controllers/proposal_create',
    'controllers/group',
    'text!templates/partials/views/alert.html',
    'text!templates/partials/views/lightbox.html',
    'text!templates/partials/blocks/topic_statistics.html',
    'text!templates/partials/blocks/topic_tabs.html',
    'text!templates/partials/blocks/topic_levels.html',
    'text!templates/partials/blocks/topic_author.html',
    'text!templates/partials/blocks/topic_final.html',
    'text!templates/partials/blocks/group_state.html',
    'text!templates/partials/blocks/group_members.html',
    'text!templates/partials/blocks/group_chat.html',
    'text!templates/partials/blocks/proposal_tabs.html',
    'text!templates/partials/blocks/proposal_state.html',
    'text!templates/partials/blocks/document_state.html',
    'text!templates/partials/blocks/social.html'
], function(
    Marionette,
    Handlebars,
    Login,
    Register,
    Navi,
    User,
    Settings,
    Topics,
    Topic,
    Proposal,
    ProposalCreate,
    Group,
    AlertPartials,
    LightboxPartials,
    StatBlockPartials,
    TopicTabsBlockPartials,
    TopicLevelsBlockPartials,
    TopicAuthorBlockPartials,
    TopicFinalBlockPartials,
    GroupStateBlockPartials,
    GroupMembersBlockPartials,
    GroupChatBlockPartials,
    ProposalTabsBlockPartials,
    ProposalStateBlockPartials,
    DocumentStateBlockPartials,
    Social
    ) {
    
    var login = new Login();
    var register = new Register();
    var navi = new Navi();
    var user = new User();
    var settings = new Settings();
    var topics = new Topics();
    var topic = new Topic();
    var proposal = new Proposal();
    var proposal_create = new ProposalCreate();
    var group = new Group();
    
    var Module = function(module, App) {
        App.eventAggregator.on('App:user_action',  navi.route_navi_index.bind(navi), true);
        //App.eventAggregator.on('App:logged_in',  navi.route_navi_index.bind(navi), true);
        navi.route_navi_index(navi);
        
        // Handle 404 error (needs to be added first)
        // TODO redirect to specific 404 page
        App.router.route('*notFound', 'topics_index', topics.route_topics_index.bind(topics));
        
        App.router.route('', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
        App.router.route('user/:id', 'user_index', user.route_user_index.bind(user));
        App.router.route('settings', 'settings_index', settings.route_settings_index.bind(settings));
        App.router.route('topics', 'topics_index', topics.route_topics_index.bind(topics));
        App.router.route('topic/:id', 'topic_index', topic.route_topic_index.bind(topic));
        App.router.route('proposal/:id', 'proposal_index', proposal.route_proposal_index.bind(proposal));
        App.router.route('proposal_create/:id', 'proposal_create_index', proposal_create.route_proposal_index.bind(proposal_create));
        App.router.route('group/:id', 'group_index', group.route_group_index.bind(group));
    };
    
    Handlebars.registerPartial('alert', AlertPartials);
    Handlebars.registerPartial('lightbox', LightboxPartials);
    Handlebars.registerPartial('topic_statistics', StatBlockPartials);
    Handlebars.registerPartial('topic_tabs', TopicTabsBlockPartials);
    Handlebars.registerPartial('topic_levels', TopicLevelsBlockPartials);
    Handlebars.registerPartial('topic_author', TopicAuthorBlockPartials);
    Handlebars.registerPartial('topic_final', TopicFinalBlockPartials);
    Handlebars.registerPartial('group_state', GroupStateBlockPartials);
    Handlebars.registerPartial('group_members', GroupMembersBlockPartials);
    Handlebars.registerPartial('group_chat', GroupChatBlockPartials);
    Handlebars.registerPartial('proposal_tabs', ProposalTabsBlockPartials);
    Handlebars.registerPartial('proposal_state', ProposalStateBlockPartials);
    Handlebars.registerPartial('document_state', DocumentStateBlockPartials);
    Handlebars.registerPartial('social', Social);
    
    return Module;
});