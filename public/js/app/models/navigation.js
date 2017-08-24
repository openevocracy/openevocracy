define([
    'backbone',
    'underscore',
    'constants',
    '../utils',
    '../collections/topics',
    'moment'
    ], function(
    Backbone,
    _,
    C,
    u,
    Topics,
    moment
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/user/navi',
        
        relations: {
            "topics": Topics
        },
        
        updateDerived: function() {
            this.set(C); // append constants to model
            
            this.get('topics').each(function(t) { t.updateDerivedBasic(); });
            
            // Reset proposal if no valid exists
            if(!this.get('proposals') && this.get('proposals').length == 0)
                this.set('proposals', null);
            
            // Extend some more stuff
            this.extendTimeRemaining(this.get('groups'));
            this.extendTimeRemaining(this.get('proposals'));
        },
        
        extendTimeRemaining: function(objs) {
            _.each(objs, function(obj) {
                var daysDiff = moment(obj.nextDeadline).diff(moment(), 'days');
                if(daysDiff > 0) {
                    obj.timeRemaining = daysDiff + ' ' + u.i18n('days');
                    obj.danger = 0;
                } else {
                    var hoursDiff = moment(obj.nextDeadline).diff(moment(), 'hours');
                    obj.danger = 1;
                    if(hoursDiff > 0) {
                        obj.timeRemaining = hoursDiff + ' ' + u.i18n('hours');
                    } else {
                        obj.timeRemaining = u.i18n('less than 1 hour');
                    }
                }
            });
        }
    });
    
    return Model;
});