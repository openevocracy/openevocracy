define([
    'jquery',
    'Marionette',
    'views/partials/group_events',
    'hbs!templates/groups/member_proposal'
], function(
    $,
    Marionette,
    Events,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "member_proposal",
        
        events: Events,
        
        initialize: function() {
            var title = this.model.get('participant').name + '\'s proposal';
            this.model.set('title', title);
        }
    });
    
    return View;
});