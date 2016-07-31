define([
    'underscore',
    'constants',
    'moment',
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    _,
    C,
    moment,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
        
        initialize: function() {
            this.model.set(C); // append constants to model
            
            this.extendTimeRemaining(this.model.get('groups'));
            this.extendTimeRemaining(this.model.get('proposals'));
            
            var showTopicsHeader = false;
            _.each(this.model.get('topics'), function(topic){
                if(topic.stage != C.STAGE_REJECTED)
                    showTopicsHeader = true;
            });
            this.model.set('showTopicsHeader', showTopicsHeader);
        },
        
        extendTimeRemaining: function(objs) {
            _.each(objs, function(obj) {
                var daysDiff = moment(obj.nextDeadline).diff(moment(), 'days');
                if(daysDiff > 0) {
                    obj.timeRemaining = daysDiff + " days";
                    obj.danger = 0;
                } else {
                    obj.timeRemaining = moment(obj.nextDeadline).diff(moment(), 'hours') + " hours";
                    obj.danger = 1;
                }
            });
        }
    });
    
    return View;
});
