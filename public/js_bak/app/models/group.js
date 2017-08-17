define([
    'backbone',
    'underscore'
    ], function(
    Backbone,
    _
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/group',
        
        initialize: function() {
            var self = this;
            
            this.on('change:members', function() {
                _.each(self.get('members'), function(member) {
                    if(App.session.user.get('_id') == member._id)
                        member.is_me = true;
                });
            });
        }
    });
    
    return Model;
});