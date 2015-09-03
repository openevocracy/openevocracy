(function() {
  requirejs.config({
    paths: {
      // CDN POLICY use "http://osscdn.com/#/"
      text: '//oss.maxcdn.com/requirejs.text/2.0.12/text.min',
      hbs: '../vendor/hbs', // FIXME
      jquery: '//oss.maxcdn.com/jquery/2.1.4/jquery.min',
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
      bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
      bootstrapcustom: '../vendor/bootstrap.custom',
      ratyfa: '../vendor/jquery.raty-fa'
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
      jquerycookie: {
        deps: ['jquery']
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
      },
      bootstrapcustom : {
        deps: ['bootstrap']
      }
    },
    hbs: {
      disableI18n: true,
      templateExtension: '.html'
    }
  });
  
  require(['underscore','backbone','handlebars'], function(_, Backbone, Handlebars) {
    // register handlebars helper for equality conditions
    Handlebars.registerHelper('ifis', function(a, b, opts) {
          if(a == b) {
              return opts.fn(this);
          } else {
              return opts.inverse(this);
          }
    });
    // force ajax call on all browsers
    $.ajaxSetup({ cache: false });
    
    /*$('[data-toggle="popover"]').on('DOMNodeInserted') popover();
    $(document).on('DOMNodeInserted','[data-toggle="tooltip"]',
      function(e) {e.target.tooltip();});*/

    require(['application'], function(Application) {
      App = new Application();
      App.start();
    });
  });
})();