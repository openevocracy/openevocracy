define([
    'jquery',
    'Marionette',
    'hbs!templates/groups/members'
], function(
    $,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            'click .member-proposal': function(e) {
                this.trigger(
                    "members:show_member_proposal",
                    e.target.getAttribute('data-member-id'));
                
                e.preventDefault();
            }
        }
    });
    
    return View;
});