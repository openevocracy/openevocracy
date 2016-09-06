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
            this.extendShowStatus(this.model.get('topics'));
            
            console.log(this.model.get('proposals'));
            
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
                    var hoursDiff = moment(obj.nextDeadline).diff(moment(), 'hours');
                    obj.danger = 1;
                    if(hoursDiff > 0) {
                        obj.timeRemaining = hoursDiff + " hours";
                    } else {
                        obj.timeRemaining = "less than 1 hour";
                    }
                }
            });
        },
        
        extendShowStatus: function(topics) {
            _.each(topics, function(topic) {
                if(topic.stage == C.STAGE_REJECTED || topic.stage == C.STAGE_PASSED) {
                    topic.show = false;
                } else {
                    topic.show = true;
                }
            });
        }
    });
    
    return View;
});
