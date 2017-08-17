define([
    'backbone',
    'models/user'
    ], function(
        Backbone,
        Model
    ) {
    var Collection = Backbone.Collection.extend({
        url: '/json/users',
        model: Model
    });
    
    return Collection;
});