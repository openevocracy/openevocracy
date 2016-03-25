define([
    'Marionette',
    'handlebars',
    'controllers/login',
    'controllers/register',
    'text!templates/partials/views/header.html',
    'text!templates/partials/views/messages.html'
], function(
    Marionette,
    Handlebars,
    Login,
    Register,
    HeaderPartial,
    MessagesPartials
    ) {

    var login = new Login();
    var register = new Register();
    
    var Module = function(module, App) {
        App.router.route('', 'login_index', login.route_login_index.bind(login));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('verified', 'verified_index', login.route_verified_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
    };
    
    Handlebars.registerPartial('header', HeaderPartial);
    Handlebars.registerPartial('messages', MessagesPartials);
    
    return Module;
});