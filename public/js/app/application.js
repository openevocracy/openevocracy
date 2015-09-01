define([
  'underscore',
  'jquery',
  'Marionette',
  'models/session',
  'router',
  'layouts/splash',
  'layouts/application',
  'bootstrap',
  'bootstrapcustom'
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
        
        if(this.session.is_logged_in())
            this.loadCoreModule(this.startHistory);
        else
            this.loadSplashModule(this.startHistory);
        
        // load splash module on login
        this.eventAggregator.on('App:logged_in',this.loadCoreModule.bind(this,this.onLogin), true);
        this.eventAggregator.on('App:logged_out',this.onLogout, true);
        
        $('#loading').fadeOut(500);
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
            this.module('core',CoreModule);
            this.setAppLayout();
            
            callback();
          }.bind(this));
    },
    
    loadSplashModule: function(callback) {
        require(['modules/splash'],
          function(SplashModule) {
            this.module('core',SplashModule);
            this.setSplashLayout();
            
            callback();
            
            // preload core module and app layout
            require(['modules/core','layouts/application']);
          }.bind(this));
      }
  });
  
  return Application;
});