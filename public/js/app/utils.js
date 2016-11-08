define([
    'jquery',
    'underscore',
    'i18n!nls/lang'
    ], function(
    $,
    _,
    i18n
    ) {
    
    var utils = {
        decodeServerMessage: function(err) {
            return (i18n != undefined ? (i18n[err.message] != undefined ? i18n[err.message] : err.message) : err.message);
            // TODO return _.format(i18n[err.message],err.args);
        },
        
        handleActive: function(target) {
            // TODO: Delete isactive.js some time
            
            /* reset everything */
            $("[data-link]").removeClass('active');
            /* activate current element */
            target.addClass('active');
            /* activate parent elements */
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
    
    // NOTE
    // Because a view change triggered in group_events.js and the group controller,
    // it recreates all buttons directly afterwards.
    // Therefore setActive MUST be called from the new view's onShow() method
    // in order for this to work.
    $(document.body).on('click', '[data-link]', function(event) {
        var target = $(event.target);
        if(target.is('span'))
            target = target.parent();
        utils.handleActive(target);
    });

    return utils;
});