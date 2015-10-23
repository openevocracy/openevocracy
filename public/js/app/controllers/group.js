define([
    'underscore',
    'Marionette',
    //'layouts/center_right',
    'views/blocks/navigation',
    'views/blocks/group_tabs',
    'views/blocks/group_proposals',
    'views/groups/collaborative',
    'views/groups/members',
    'views/groups/member_proposal',
    'models/group'
], function(
    _,
    Marionette,
    //CenterRightLayout,
    NaviView,
    GroupTabsBlock,
    GroupProposalsBlock,
    CollabView,
    MembersView,
    MembersProposalView,
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
            /*this.centerRightLayout = new CenterRightLayout();
            App.layout.view.show(this.centerRightLayout);
            
            this.group.fetch().done(function () {
                this.collabView = new CollabView({model:this.group});
                this.membersView = new MembersView({model:this.group});
                this.membersView.bind("members:show_member_proposal", this.show_member_proposal);
                
                this.show_collab();
                
                $('#right').append('<div id="group-tabs"></div>');
                this.centerRightLayout.addRegion('group_tabs','#group-tabs');
                var groupTabsBlock = new GroupTabsBlock({model:this.group});
                groupTabsBlock.bind("group_tabs:show_collab", this.show_collab);
                groupTabsBlock.bind("group_tabs:show_members", this.show_members);
                this.centerRightLayout.group_tabs.show(groupTabsBlock);
                
                $('#right').append('<div id="group-proposals"></div>');
                this.centerRightLayout.addRegion('group_proposals','#group-proposals');
                var groupProposalsBlock = new GroupProposalsBlock({model:this.group});
                groupProposalsBlock.bind("group_proposals:show_member_proposal", this.show_member_proposal);
                this.centerRightLayout.group_proposals.show(groupProposalsBlock);
            }.bind(this));*/
        }/*,
        
        show_collab: function() {
            this.centerRightLayout.center.show(this.collabView, { preventDestroy: true });
            $('#center-right .btn').removeClass('active');
        },
        
        show_members: function() {
            this.centerRightLayout.center.show(this.membersView, { preventDestroy: true });
            $('#center-right .btn').removeClass('active');
        },
        
        show_member_proposal: function(member_id) {
            var participant = _.findWhere(this.group.get('participants'), {'_id': member_id});
            
            this.centerRightLayout.center.show(
                new MembersProposalView({model: new Backbone.Model(participant)}),
                { preventDestroy: true });
            
            $('#center-right .btn').removeClass('active');
            $('[data-member-id="'+member_id+'"]').addClass('active');
        }*/
    });
    
    return Controller;
});
