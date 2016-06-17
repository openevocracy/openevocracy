define([
    'backbone'
    ], function(
    Backbone
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/user/navi'
    });
    
    return Model;
});