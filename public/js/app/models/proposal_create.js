define([
    'backbone',
    'configs'
    ], function(
    Backbone,
    cfg
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: 'tid',
        urlRoot: '/json/proposal/create',
        
        initialize: function() {
            this.set('minwords', cfg.MIN_WORDS_PROPOSAL);
        }
    });
    
    return Model;
});