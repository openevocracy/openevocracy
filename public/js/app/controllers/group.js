define([
    'underscore',
    'Marionette',
    'layouts/center_right',
    'views/blocks/navigation',
    'views/blocks/group_tabs',
    'views/groups/collaborative',
    'views/groups/members',
    'models/group'
], function(
    _,
    Marionette,
    CenterRightLayout,
    NaviView,
    GroupTabsBlock,
    CollabView,
    MembersView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        
        initialize: function() {
            _.bindAll.apply(_, [this].concat(_.functions(this)));
        },
        
        route_group_index: function(id) {
            this.group = new Model({_id:id});
            
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            this.centerRightLayout = new CenterRightLayout();
            App.layout.view.show(this.centerRightLayout);
            
            this.group.fetch().done(function () {
                this.collabView = new CollabView({model:this.group});
                this.membersView = new MembersView({model:this.group});
                
                this.show_collab();
                
                $('#right').append('<div id="group-tabs"></div>');
                this.centerRightLayout.addRegion('group_tabs','#group-tabs');
                var groupTabsBlock = new GroupTabsBlock({model:this.group});
                groupTabsBlock.bind("group_tabs:show_collab", this.show_collab);
                groupTabsBlock.bind("group_tabs:show_members", this.show_members);
                this.centerRightLayout.group_tabs.show(groupTabsBlock);
                
                
                /*$('#right').append('<div id="ourproposal"></div>');
                this.centerRightLayout.addRegion('ourproposal','#ourproposal');
                this.centerRightLayout.ourproposal.show(new OurProposalBlock({model:this.group}));
                
                $('#right').append('<div id="group-members"></div>');
                this.centerRightLayout.addRegion('group_members','#group-members');
                var groupMembersBlock = new GroupMembersBlock({model:this.group});
                groupMembersBlock.bind("group_members:show_members", this.show_members);
                this.centerRightLayout.group_members.show(groupMembersBlock);*/
            }.bind(this));
        },
        
        show_collab: function() {
            this.centerRightLayout.center.show(this.collabView, { preventDestroy: true });
        },
        
        show_members: function() {
            this.centerRightLayout.center.show(this.membersView, { preventDestroy: true });
        }
        
    });
    
    return Controller;
});
