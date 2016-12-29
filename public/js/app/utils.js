define([
    'jquery',
    'underscore',
    'constants',
    'i18n!nls/lang'
    ], function(
    $,
    _,
    C,
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
        activeDataLinks: [],
        
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
        }
        
        /*appendTopicModel: function(topic) {
            // Requires that model contains stage and topic _id
            
            // Append creationDate
            //topic.timeCreated = utils.getTimestamp(topic._id);
            
            // Append tage name
            switch (topic.stage) {
                case C.STAGE_REJECTED:
                    topic.stageName = i18n['rejected stage'];
                    break;
                case C.STAGE_SELECTION:
                    topic.stageName = i18n['selection stage'];
                    //model.set('stageName', this.i18n('selection stage'));
                    break;
                case C.STAGE_PROPOSAL:
                    topic.stageName = i18n['proposal stage'];
                    //model.set('stageName', this.i18n('proposal stage'));
                    break;
                case C.STAGE_CONSENSUS:
                    topic.stageName = i18n['consensus stage'];
                    //model.set('stageName', this.i18n('consensus stage'));
                    break;
                case C.STAGE_PASSED:
                    topic.stageName = i18n['passed stage'];
                    //model.set('stageName', this.i18n('passed stage'));
                    break;
                default:
                    topic.stageName = i18n['unknown stage'];
                    //model.set('stageName', 'unknown');
                    break;
            }
        }*/
    };

    return utils;
});