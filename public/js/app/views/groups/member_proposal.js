define([
    'jquery',
    'Marionette',
    'views/partials/group_events',
    'hbs!templates/groups/member_proposal',
    '../utils'
], function(
    $,
    Marionette,
    Events,
    Template,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "member_proposal",
        
        events: Events,
        
        initialize: function() {
            var title = this.model.get('member').name + '\'s proposal';
            this.model.set('title', title);
        },
        
        onShow: function() {
            u.setActive('grpmem-'+this.model.get('member')._id);
            //u.setActive('nav-'+this.model.get('_id'));
        }
    });
    
    return View;
});