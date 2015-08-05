define([
  'underscore',
  'jquery',
  'Marionette',
  'layouts/application',
  'models/session_test',
  'router'
], function (
  _,
  $,
  Marionette,
  AppLayout,
  Session,
  AuthRouter
  ) {
  
  var Application = Marionette.Application.extend({
    // TODO wie in 4-backbone-login-master/public/router.js
    
    session: new Session(),
    layout: new AppLayout(),
    router: new AuthRouter(),

    onStart: function() {
        $('body').prepend(App.layout.render().el);
        //Backbone.history.start({ pushState: false, root: '/' });
        
        $('#loading').fadeOut(500);
    }
  });
  
  // force ajax call on all browsers
  $.ajaxSetup({ cache: false });
  
  // Global event aggregator
  Application.eventAggregator = _.extend({}, Backbone.Events);
  
  return Application;
});