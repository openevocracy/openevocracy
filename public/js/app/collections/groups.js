define([
    'backbone',
    'models/group'
    ], function(
        Backbone,
        Model
    ) {
    var Collection = Backbone.Collection.extend({
        url: '/json/groups',
        model: Model
    });
    
    return Collection;
});