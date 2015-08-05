define([
    'underscore',
    'backbone'
], function(_, Backbone){

    var UserModel = Backbone.Model.extend({

        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },

        defaults: {
            uid: '',
            email: '' // TODO maybe remove later?
        },

        url: function(){
            return '/json/user';
        },

    });
    
    return UserModel;
});