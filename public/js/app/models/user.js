define([
    'underscore',
    'backbone'
], function(_, Backbone){

    var UserModel = Backbone.Model.extend({

        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },

        url: function(){
            return '/json/user';
        },

    });
    
    return UserModel;
});