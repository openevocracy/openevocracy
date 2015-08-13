(function() {
  requirejs.config({
    paths: {
      text: '../vendor/text',
      hbs: '../vendor/hbs',
      jquery: '../vendor/jquery.min',
      jquerycookie: '../vendor/jquery.cookie.min',
      jquerycountdown: '../vendor/jquery.countdown.min',
      underscore: '../vendor/underscore-min',
      backbone: '../vendor/backbone-min',
      //Backbone: '../vendor/backbone-min',
      BackboneRouteFilter: '../vendor/backbone.routefilter.min',
      Marionette: '../vendor/backbone.marionette.min',
      handlebars: '../vendor/handlebars',
      ember: '../vendor/ember.min',
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
  
  require(['underscore','backbone'], function(_, Backbone) {
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