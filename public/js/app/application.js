define([
  'underscore',
  'jquery',
  'Marionette',
  'layouts/application',
  'models/session',
  'router',
  'bootstrap',
  'bootstrapcustom'
], function (
  _,
  $,
  Marionette,
  AppLayout,
  Session,
  AuthRouter
  ) {
  
  var Application = Marionette.Application.extend({
    session: new Session(),
    layout: new AppLayout(),
    router: new AuthRouter(),
    eventAggregator: _.extend({}, Backbone.Events),
    
    onStart: function() {
        $('body').prepend(App.layout.render().el);
        //Backbone.history.start({ pushState: false, root: '/' });
        
        $('#loading').fadeOut(500);
    }
  });
  
  return Application;
});