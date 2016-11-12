define([
    'jquery',
    'underscore',
    'i18n!nls/lang'
    ], function(
    $,
    _,
    i18n
    ) {
    
    // This needs to be on top, since it needs to run before functions are instanciated
    $(document.body).on('click', '[data-link]', function(event) {
        var target = $(event.target);
        if(target.is('span'))
            target = target.parent();
        utils.handleActive(target);
    });
    
    var utils = {
        i18n: function(str) {
            // for Handlebars implementation see main.js
            return (i18n != undefined ? (i18n[str] != undefined ? i18n[str] : str) : str);
        },
        
        decodeServerMessage: function(err) {
            return this.i18n(err.message);
            // TODO return _.format(this.i18n(err.message),err.args);
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
        
        setActive: function(linkName) {
            this.handleActive($("[data-link=" + linkName + "]"));
        }
    };

    return utils;
});