define([
    'underscore',
    'constants',
    '../../utils',
    'moment',
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    _,
    C,
    u,
    moment,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
        
        initialize: function() {
            this.model.set(C); // append constants to model
            
            // Append topic stage names
            _.each(this.model.get('topics'), u.appendStageName);
            
            // Reset proposal if no valid exists
            if(!this.model.get('proposals')[0])
                this.model.set('proposals', null);
            
            // Extend some more stuff
            this.extendTimeRemaining(this.model.get('groups'));
            this.extendTimeRemaining(this.model.get('proposals'));
            this.extendShowStatus(this.model.get('topics'));
            
            var showTopicsHeader = false;
            _.each(this.model.get('topics'), function(topic){
                if(topic.stage != C.STAGE_REJECTED)
                    showTopicsHeader = true;
            });
            this.model.set('showTopicsHeader', showTopicsHeader);
            
            // // render on change
            // this.model.on('change', this.render, this);
            // // create timer for automatic refreshing of list
            // this.timer = setInterval(function() {
            //     this.model.fetch();
            //     console.log(this.model.get('topics'))
            // }.bind(this), 10000);
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
