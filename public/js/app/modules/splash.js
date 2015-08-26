define([
    'Marionette',
    'controllers/login',
    'controllers/register'
], function(
    Marionette,
    Login,
    Register
    ) {

    var login = new Login();
    var register = new Register();
    
    var Module = function(module, App) {
        App.router.route('', 'login_index', login.route_login_index.bind(login));
        App.router.route('login', 'login_index', login.route_login_index.bind(login));
        App.router.route('register', 'register_index', register.route_register_index.bind(register));
    };
    
    return Module;
});