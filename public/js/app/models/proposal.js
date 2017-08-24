define([
    'backbone',
    'configs'
    ], function(
    Backbone,
    cfg
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: 'ppid',
        urlRoot: '/json/proposal',
        
        initialize: function() {
            this.set('minwords', cfg.MIN_WORDS_PROPOSAL);
        }
    });
    
    return Model;
});