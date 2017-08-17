define([
    'underscore',
    'backbone'
], function(_, Backbone){
    
    var UserModel = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/user/profile'
    });
    
    return UserModel;
});