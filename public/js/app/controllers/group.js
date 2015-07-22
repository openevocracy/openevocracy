define([
    'Marionette',
    'layouts/center_right',
    'views/blocks/navigation',
    'views/blocks/ourproposal',
    'views/blocks/group_members',
    'views/groups/collaborative',
    'models/group'
], function(
    Marionette,
    CenterRightLayout,
    NaviView,
    OurProposalView,
    GroupMembersView,
    CollabView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_group_index: function(id) {
            var group = new Model({_id:id});
            
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            group.fetch().done(function () {
                var collabView = new CollabView({model:group});
                centerRightLayout.center.show(collabView);
                
                
                $('#right').append('<div id="ourproposal"></div>');
                centerRightLayout.addRegion('ourproposal','#ourproposal');
                centerRightLayout.ourproposal.show(new OurProposalView({model:group}));
                
                $('#right').append('<div id="group-members"></div>');
                centerRightLayout.addRegion('group_members','#group-members');
                centerRightLayout.group_members.show(new GroupMembersView({model:group}));
            });
        }
    });
    
    return Controller;
});
