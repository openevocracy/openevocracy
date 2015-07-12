define([
    'backbone'
    ], function(
    Backbone
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/topic',
        
        setVoted: function(status) {
            $.post(status ? '/json/topic-vote' : '/json/topic-unvote',
               {'tid':this.get('_id')},
               function(data) {
                   this.set({'votes': data, 'voted': status});
               }.bind(this));
        },
        
        setJoined: function(status) {
            $.post(status ? '/json/topic-join' : '/json/topic-unjoin',
               {'tid':this.get('_id')},
               function(data) {
                   this.set({'participants': data, 'joined': status});
               }.bind(this));
        }
    });
    
    return Model;
});