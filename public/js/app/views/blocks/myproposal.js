define([
    'application',
    'Marionette',
    'hbs!templates/blocks/myproposal'
], function(
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            'click #yourprop': function(e) {
                var warning = 'You have to join the topic before you can create your proposal. Do you want to join "'+this.model.get('name')+'" now? ';
                if(!this.model.get('joined')) {
                    // if user has not joined this topic, force join
                    if(confirm(warning)) {
                        this.model.setJoined(true);
                        return true;
                    } else {
                        e.preventDefault();
                    }
                }
            }
        },
        
        initialize: function() {
            
        }
    });
    
    return View;
});
