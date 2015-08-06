/**
 * @desc        backbone router for pushState page routing
 */

define([
'Marionette'
], function(Marionette){
    
    var AuthRouter = Marionette.AppRouter.extend({
        
        // http://stackoverflow.com/questions/10326244/what-to-be-done-to-prevent-the-router-url-being-used-directly-on-the-address-bar
        
        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },
        
        before: function( route, params ){
            if(App.session.is_logged_in() ||
               route == '' || route == 'login' || route == 'register')
                return true;
            
            this.navigate('login',true);
            return false;
        }
    });

    return AuthRouter;
});
