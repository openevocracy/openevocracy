define([
    'application',
    'Marionette',
    'hbs!templates/blocks/group_pads'
], function(
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            /*'click #grpmem': function(e) {
                if(e) e.preventDefault();
                this.trigger("group_tabs:show_members");
                this.$('.barbtn').removeClass('active');
                this.$('#grpmem').addClass('active');
            },
            'click #ourprop': function(e) {
                if(e) e.preventDefault();
                this.trigger("group_tabs:show_collab");
                this.$('.barbtn').removeClass('active');
                this.$('#ourprop').addClass('active');
            }
            */
        },
        
        initialize: function() {
            console.log(this.group);
        }
    });
    
    return View;
});
