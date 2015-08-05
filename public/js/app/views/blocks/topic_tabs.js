define([
    'application',
    'Marionette',
    'hbs!templates/blocks/topic_tabs',
    'constants'
], function(
    app,
    Marionette,
    Template,
    C
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        initialize: function() {
            if(this.model.get('stage') >= C.STAGE_PROPOSAL)
                this.model.set('myproposal_exists', true);
            if(this.model.get('stage') == C.STAGE_CONSENSUS && typeof this.model.get('gid') != 'undefined')
                this.model.set('ourgroup_exists', true);
        }
    });
    
    return View;
});
