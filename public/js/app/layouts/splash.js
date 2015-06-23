// http://stackoverflow.com/questions/10326244/what-to-be-done-to-prevent-the-router-url-being-used-directly-on-the-address-bar

define([
  'jquery',
  'Marionette',
  'layouts/splash',
  'router'
], function (
  $,
  Marionette,
  SplLayout,
  AuthRouter
  ) {
    
  // will be overwritten by main
  var Router = Marionette.AppRouter.extend();
  
  var Splash = Marionette.Application.extend({
    layout: new SplLayout(),
    router: new Router(),
    
    // TODO wie in 4-backbone-login-master/public/router.js
    
    // NOTE we cannot create session here because it does JSON calls
    //session: new Session(),

    onStart: function() {
        $('body').prepend(App.layout.render().el);
        //Backbone.history.start({ pushState: false, root: '/' });
        
        $('#loading').fadeOut(500);
    }
  });
  
    $.ajaxSetup({ cache: false });          // force ajax call on all browsers


  return Splash;
});