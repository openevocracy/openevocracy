define([
  'underscore',
  'jquery',
  'Marionette',
  'models/session',
  'router',
  'bootstrap',
  'bootstrapcustom'
], function (
  _,
  $,
  Marionette,
  Session,
  Router
  ) {
  
  var Application = Marionette.Application.extend({
    session: new Session(),
    router: new Router(),
    eventAggregator: _.extend({}, Backbone.Events),
    
    onStart: function() {
        if(this.session.is_logged_in())
            this.loadCoreModule();
        else
            this.loadSplashModule();
        
        // load splash module on login
        this.eventAggregator.on('App:logged_in',this.loadCoreModule.bind(this), true);
        
        $('#loading').fadeOut(500);
    },
    
    render: function() {
        $('#layout').empty();
        $('#layout').prepend(this.layout.render().el);
        
        // history should be started when all routes are defined        
        if(!Backbone.history.started)
            Backbone.history.start({ pushState: false, root: '/' });
    },
    
    loadCoreModule: function() {
        require(['modules/core','layouts/application'],
          function(CoreModule,AppLayout) {
            this.module('core',CoreModule);
            this.layout = new AppLayout();
            
            // render the app
            this.render();
          }.bind(this));
    },
    
    loadSplashModule: function() {
        require(['modules/splash','layouts/splash'],
          function(SplashModule,SplashLayout) {
            this.module('core',SplashModule);
            this.layout = new SplashLayout();
          
            // render the app
            this.render();
            
            // preload core module and app layout
            require(['modules/core','layouts/application']);
          }.bind(this));
      }
  });
  
  return Application;
});