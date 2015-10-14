define([
    'Marionette',
    'hbs!templates/blocks/group_tabs'
], function(
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            'click #grpmem': function(e) {
                this.trigger("group_tabs:show_members");
                $('#center-right .btn').removeClass('active');
                $('#grpmem').addClass('active');
                if(e) e.preventDefault();
            },
            'click #ourprop': function(e) {
                this.trigger("group_tabs:show_collab");
                $('#center-right .btn').removeClass('active');
                $('#ourprop').addClass('active');
                if(e) e.preventDefault();
            },
            
            /*'click .group_tab': function(e) {
                this.trigger("page_changed",e);
                $(e.target).addClass('active');
                if(e) e.preventDefault();
            },
            
            'page_changed' : function(e) {
                $('.group_tab .btn').removeClass('active');
                
                if(e.target == "block1link")
                    $('block2link').addClass('active');
            }*/
        }
    });
    
    return View;
});
