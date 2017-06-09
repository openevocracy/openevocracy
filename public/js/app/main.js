(function() {
  var locale = localStorage.getItem('locale') || 'de';
    
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
      BackboneNestedModels: "../vendor/backbone.nested.models.min",
      BackboneRouteFilter: '../vendor/backbone.routefilter.min',
      BackboneSparks: '../vendor/backbone.spark',
      Marionette: '//oss.maxcdn.com/backbone.marionette/2.4.2/backbone.marionette.min',
      //handlebars: '//oss.maxcdn.com/handlebarsjs/3.0.3/handlebars.min',
      handlebars: 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.5/handlebars.min',
      ColorHash: '../bower_components/color-hash/dist/color-hash',
      bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
      material: '../vendor/material.min',
      moment: '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.11.1/moment.min',
      ratyfa: '../vendor/jquery.raty-fa',
      parsley: '//cdnjs.cloudflare.com/ajax/libs/parsley.js/2.3.5/parsley.min',
      constants: '../setup/constants',
      configs: '../setup/configs',
      //quill: '//cdn.quilljs.com/1.0.6/quill.min',
      quill: '../vendor/quill',
      socketio: 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.2/socket.io.slim',
      strftime: '../vendor/strftime.min',
      //Embed: '../vendor/embed.min',
      emojify: '//cdnjs.cloudflare.com/ajax/libs/emojify.js/1.1.0/js/emojify.min',
      jsSocials: '//cdn.jsdelivr.net/jquery.jssocials/1.4.0/jssocials.min'
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
      BackboneNestedModels: {
        deps: ['backbone'],
        exports: 'BackboneNestedModels'
      },
      BackboneRouteFilter: {
        deps: ['backbone'],
        exports: 'BackboneRouteFilter'
      },
      BackboneSparks: {
        deps: ['backbone'],
        exports: 'BackboneSparks'
      },
      Marionette: {
        deps: ['jquery', 'underscore', 'BackboneNestedModels', 'BackboneRouteFilter', 'BackboneSparks'],
        exports: 'Marionette'
      },
      handlebars: {
        exports: 'Handlebars'
      },
      bootstrap : {
        deps: ['jquery']
      },
      material : {
        deps: ['bootstrap']
      },
      strftime : {
          exports: 'strftime'
      },
      /*Embed: {
          exports: 'Embed'
      },*/
      emojify: {
          exports: 'emojify'
      }
    },
    hbs: {
      templateExtension: '.html',
      partialsUrl: 'templates/partials'
    },
    config: {i18n: {'locale': locale}}
  });
  
    require([
      'underscore',
      'backbone',
      'handlebars',
      'i18n!nls/lang'
    ], function(
        _,
        Backbone,
        Handlebars,
        i18n
    ) {
        // register handlebars i18n helper
        // for javascript implementation see utils.js
        Handlebars.registerHelper('i18n',
            function(str) {
                return (i18n != undefined ? (i18n[str] != undefined ? i18n[str] : str) : str);
            }
        );
        
        // register handlebars helper for equality conditions
        Handlebars.registerHelper('ifis', function(a, b, opts) {
          if(a == b) {
              return opts.fn(this);
          } else {
              return opts.inverse(this);
          }
        });
        Handlebars.registerHelper('ifisnot', function(a, b, opts) {
          if(a != b) {
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
        Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
            lvalue = parseFloat(lvalue);
            rvalue = parseFloat(rvalue);
                
            return {
                "+": lvalue + rvalue,
                "-": lvalue - rvalue,
                "*": lvalue * rvalue,
                "/": lvalue / rvalue,
                "%": lvalue % rvalue
            }[operator];
        });
        // force ajax call on all browsers
        $.ajaxSetup({ cache: false });
        
        require(['application'], function(Application) {
          App = new Application();
          App.start();
        });
    });
})();