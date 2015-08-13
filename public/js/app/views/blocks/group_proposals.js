define([
    'Marionette',
    'hbs!templates/blocks/group_proposals'
], function(
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            'click .member-proposal': function(e) {
                this.trigger(
                    "group_proposals:show_member_proposal",
                    e.target.getAttribute('data-member-id'));
                
                e.preventDefault();
            }
        },
    });
    
    return View;
});
