define([
    'backbone'
    ], function(
    Backbone
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: 'tid',
        urlRoot: '/json/proposal'
    });
    
    return Model;
});