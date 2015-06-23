/**
 * @desc        backbone router for pushState page routing
 */

define([
    "application",
    "BackboneRouteFilter"
], function(app,BackboneRouteFilter){

    var AuthRouter = Backbone.Router.extend({
        
        // http://stackoverflow.com/questions/10326244/what-to-be-done-to-prevent-the-router-url-being-used-directly-on-the-address-bar
        
        loggedIn: false, // new for Splash, implement in before function??
        
        setLoggedIn: function() { // new
            this.loggedIn = true; 
        },
        
        sendUserToHome: function() { // new, implement in before function?
            this.navigate('home', {trigger:true});
        },

        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },
        
        before: function( route, params ){
            //return true;
            
            if((app && app.session.get('logged_in')) ||
               route == 'login' || route == 'register')
                return true;
            
            this.navigate('login',true);
            return false;
        }

    });

    return AuthRouter;

});
