define([
    'backbone',
    'models/topic'
    ], function(
        Backbone,
        Model
    ) {
    
    var Collection = Backbone.Collection.extend({
        url: '/json/topics',
        model: Model
    });
    
    return Collection;
});