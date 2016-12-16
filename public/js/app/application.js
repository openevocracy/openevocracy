define([
  'underscore',
  'jquery',
  'Marionette',
  'models/session',
  'router',
  'layouts/splash',
  'layouts/application',
  'bootstrap',
  'bootstrapcustom',
  'material'
], function (
  _,
  $,
  Marionette,
  Session,
  Router,
  SplashLayout,
  AppLayout
  ) {
  
  var Application = Marionette.Application.extend({
    session: new Session(),
    router: new Router(),
    eventAggregator: _.extend({}, Backbone.Events),
    
    onStart: function() {
        _.bindAll.apply(_, [this].concat(_.functions(this)));
        
        if(this.session.isLoggedIn())
            this.loadCoreModule(this.startHistory);
        else
            this.loadSplashModule(this.startHistory);
        
        // Load splash module on login
        this.eventAggregator.on('App:logged_in',this.loadCoreModule.bind(this,this.onLogin), true);
        this.eventAggregator.on('App:logged_out',this.onLogout, true);
        
        // Fade out loading wheel
        $('#loading').fadeOut(500);
        
        // Load material js functionality
        $.material.init();
    },
    
    startHistory: function() {
        Backbone.history.start({ pushState: false, root: '/' });
    },
    
    onLogin: function() {
        this.router.navigate('topics', true);
    },
    
    onLogout: function() {
        this.session.logout({});
        this.setSplashLayout();
    },
    
    setAppLayout: function() {
        this.layout = new AppLayout();
        
        $('#layout').empty();
        $('#layout').prepend(this.layout.render().el);
    },
    
    setSplashLayout: function() {
        this.layout = new SplashLayout();
        
        $('#layout').empty();
        $('#layout').prepend(this.layout.render().el);
    },
    
    loadCoreModule: function(callback) {
        require(['modules/core'],
          function(CoreModule) {
            this.setAppLayout();
            this.module('core',CoreModule);
            
            callback();
          }.bind(this));
    },
    
    loadSplashModule: function(callback) {
        require(['modules/splash'],
          function(SplashModule) {
            this.setSplashLayout();
            this.module('splash',SplashModule);
            
            callback();
            
            // preload core module and app layout
            require(['modules/core','layouts/application']);
          }.bind(this));
      }
  });
  
  return Application;
});