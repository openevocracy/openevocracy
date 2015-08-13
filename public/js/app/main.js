(function() {
  requirejs.config({
    paths: {
      // CDN POLICY use "http://osscdn.com/#/"
      text: '//oss.maxcdn.com/requirejs.text/2.0.12/text.min',
      hbs: '../vendor/hbs', // FIXME
      jquery: '//oss.maxcdn.com/jquery/3.0.0-alpha1/jquery.min',
      jquerycookie: '../vendor/jquery.cookie.min',
      jquerycountdown: '../vendor/jquery.countdown.min',
      underscore: '//oss.maxcdn.com/underscorejs/1.8.3/underscore-min',
      backbone: '//oss.maxcdn.com/backbonejs/1.2.1/backbone-min',
      BackboneDeepmodel: '//oss.maxcdn.com/backbone.deepmodel/0.10.4/deep-model.min',
      BackboneRouteFilter: '../vendor/backbone.routefilter.min',
      Marionette: '//oss.maxcdn.com/backbone.marionette/2.4.2/backbone.marionette.min',
      handlebars: '//oss.maxcdn.com/handlebarsjs/3.0.3/handlebars.min',
      ember: '//oss.maxcdn.com/emberjs/2.0.0/ember.min',
      etherpad: '../vendor/etherpad',
      bootstrap:  '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
      bootstrapcustom:  '../vendor/bootstrap.custom'
    },
    /*
    shim: Configure the dependencies, exports, and custom initialization for
    older, traditional "browser globals" scripts that do not use define() to
    declare the dependencies and set a module value.
    see http://requirejs.org/docs/api.html#config-shim
    */
    shim: {
      jquery: {
        exports: 'jQuery'
      },
      underscore: {
        exports: '_'
      },
      backbone: {
        deps: ['jquery', 'underscore'],
        exports: 'backbone'
      },
      BackboneRouteFilter: {
        deps: ['backbone'],
        exports: 'BackboneRouteFilter'
      },
      Marionette: {
        deps: ['jquery', 'underscore', 'BackboneRouteFilter'],
        exports: 'Marionette'
      },
      handlebars: {
        exports: 'Handlebars'
      },
      bootstrap : {
        deps: ['jquery']
      }
    },
    hbs: {
      disableI18n: true,
      templateExtension: '.html'
    }
  });
  
  require(['underscore','backbone','handlebars'], function(_, Backbone, Handlebars) {
    Handlebars.registerHelper('ifis', function(a, b, opts) {
          if(a == b) {
              return opts.fn(this);
          } else {
              return opts.inverse(this);
          }
    });
    
    var modules = {
        core: 'modules/core'
    };
    var files_to_load = [
      'application'
    ];
    _.each(modules, function(module) {
      files_to_load.push(module);
    });

    require(files_to_load, function(Application) {
      var app = window.App = new Application();
      var module_names = _.keys(modules);

      // initialize modules
      _.each(_.rest(arguments, 1), function(module, index) {
        app.module(module_names[index], module);
      });

      /*// Check the auth status upon initialization,
      // before rendering anything or matching routes
      app.session.checkAuth({
            // Start the backbone routing once we have captured a user's auth status
            complete: function() {
                // HTML5 pushState for URLs without hashbangs
                var hasPushstate = !!(window.history && history.pushState);
                if(hasPushstate) Backbone.history.start({ pushState: true, root: '/' } );
                else Backbone.history.start({ pushState: false, root: '/' });
            }
      });*/

      // force ajax call on all browsers
      $.ajaxSetup({ cache: false });

      app.start();
      Backbone.history.start({ pushState: false, root: '/' });
    });
  });
})();