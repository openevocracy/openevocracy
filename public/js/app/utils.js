define([
    'jquery',
    'underscore',
    'jsSocials',
    'constants',
    'i18n!nls/lang'
    ], function(
    $,
    _,
    jsSocials,
    C,
    i18n
    ) {
    
    /*
    ** This needs to be on top, since it needs to run before functions are instanciated
    */
    
    // Initalize active links event
    $(document.body).on('click', '[data-link]', function(event) {
        var target = $(event.target);
        if(target.is('span'))
            target = target.parent();
        utils.handleActive(target);
    });
    
    var utils = {
        RE: /\{\{|\}\}|\{([^\}]+)\}/g,
        activeDataLinks: [],
        
        i18n: function(str) {
            // for Handlebars implementation see main.js
            return (i18n != undefined ? (i18n[str] != undefined ? i18n[str] : str) : str);
        },
        
        i18nAlert: function(err) {
            // Translate content string
            err.content = this.i18n(err.content);
            // Format content string if variables exist
            if(err.vars)
                err.content = this.strformat(err.content, err.vars);
            return err;
        },
        
        handleActive: function(target) {
            // reset everything
            $("[data-link]").removeClass('active');
            // activate current element
            target.addClass('active');
            // activate parent elements
            var attr = target.attr('data-link-parents');
            if(typeof attr !== typeof undefined) {
                var parents = attr.split(" ");
                _.each(parents, function(parent) {
                    $('[data-link="' + parent + '"]').addClass('active');
                });
            }
        },
        
        updateActive: function() {
            _.each(this.activeDataLinks, function(linkName) {
                this.handleActive($("[data-link=" + linkName + "]"));
            }.bind(this));
        },
        
        setActive: function() {
            this.activeDataLinks = arguments;
            this.updateActive();
        },
        
        getTimestamp: function(objectid) {
            return parseInt(objectid.substring(0, 8), 16) * 1000;
        },
        
        getProperty: function(o, s) {
            // Necessary for strformat
            s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
            s = s.replace(/^\./, ''); // strip a leading dot
            var a = s.split('.');
            while (a.length) {
                var n = a.shift();
                if (n in o) {
                    o = o[n];
                } else {
                    return;
                }
            }
            return o;
        },
        
        strformat: function(str, args) {
            args = Array.prototype.slice.call(arguments, 1);
            if (args.length < 1) {
                return str; // nothing to replace
            } else if ((args.length < 2) && (typeof args[0] === 'object')) {
                args = args[0]; // handle a single array or object
            }
            return str.replace(this.RE, function (m, n) {
                if (m == '{{') {
                    return '{';
                }
                if (m == '}}') {
                    return '}';
                }
                var val = this.getProperty(args, n);
                return (typeof val === 'undefined') ? m : val;
            }.bind(this));
        },
        
        replaceUrl: function(str) {
            return str.replace(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i, '<a href="$&" target="_blank">$&</a>');
        },
        
        showShareButtons: function() {
            // Activate social share functionality
            $("#shareIcons").jsSocials({
                showLabel: false,
                showCount: false,
                shares: ["email", "twitter", "facebook", "googleplus", "linkedin", "telegram"]
            });
        }
    };

    return utils;
});