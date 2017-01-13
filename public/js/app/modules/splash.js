define([
    'Marionette',
    'handlebars',
    'controllers/login',
    'controllers/register',
    'text!templates/partials/views/alert.html'
], function(
    Marionette,
    Handlebars,
    Login,
    Register,
    AlertPartials
    ) {

    var login = new Login();
    var register = new Register();
    
    var Module = function(module, App) {
        App.router.route('', 'login_index', login.route_login_index.bind(login));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('verified', 'verified_index', login.route_verified_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
    };
    
    Handlebars.registerPartial('alert', AlertPartials);
    
    return Module;
});