(function() {
  requirejs.config({
    paths: {
      // CDN POLICY use "http://osscdn.com/#/"
      text: '//oss.maxcdn.com/requirejs.text/2.0.12/text.min',
      hbs: '../vendor/hbs',
      //hbs: '../bower_components/hbs/hbs',
      jquery: '//oss.maxcdn.com/jquery/2.1.4/jquery.min',
      jquerycookie: '../vendor/jquery.cookie.min',
      jquerycountdown: '../vendor/jquery.countdown.min',
      underscore: '//oss.maxcdn.com/underscorejs/1.8.3/underscore-min',
      underscore_string: 'https://cdn.jsdelivr.net/underscore.string/3.2.2/underscore.string.min',
      backbone: '//oss.maxcdn.com/backbonejs/1.2.1/backbone-min',
      BackboneDeepmodel: '//oss.maxcdn.com/backbone.deepmodel/0.10.4/deep-model.min',
      BackboneRouteFilter: '../vendor/backbone.routefilter.min',
      Marionette: '//oss.maxcdn.com/backbone.marionette/2.4.2/backbone.marionette.min',
      handlebars: '//oss.maxcdn.com/handlebarsjs/3.0.3/handlebars.min',
      ColorHash: '../bower_components/color-hash/dist/color-hash',
      bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
      bootstrapcustom: '../vendor/bootstrap.custom',
      moment: '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.1/moment.min',
      ratyfa: '../vendor/jquery.raty-fa',
      isactive: '../vendor/isactive',
      parsley: '//cdnjs.cloudflare.com/ajax/libs/parsley.js/2.3.5/parsley.min',
      constants: '../setup/constants',
      configs: '../setup/configs',
      quill: '//cdn.quilljs.com/1.0.0-beta.3/quill',
      socketio: '//cdn.socket.io/socket.io-1.4.5'
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
      templateExtension: '.html',
      partialsUrl: 'templates/partials'
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
    Handlebars.registerHelper('ifisOr', function(a, b, c, opts) {
      if(a == b || a == c) {
          return opts.fn(this);
      } else {
          return opts.inverse(this);
      }
    });
    Handlebars.registerHelper('ifisAnd', function(a, b, c, opts) {
      if(a == b && a == c) {
          return opts.fn(this);
      } else {
          return opts.inverse(this);
      }
    });
    Handlebars.registerHelper('ifIn', function(value, list, options) {
      if(_.contains(list,value)) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
    // force ajax call on all browsers
    $.ajaxSetup({ cache: false });
    
    /*$('[data-toggle="popover"]').on('DOMNodeInserted') popover();
    $(document).on('DOMNodeInserted','[data-toggle="tooltip"]',
      function(e) {e.target.tooltip();});*/

    require(['application','isactive'], function(Application) {
      App = new Application();
      App.start();
    });
  });
})();