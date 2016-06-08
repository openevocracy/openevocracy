define([
    'underscore',
    'Marionette',
    'views/groups/collaborative',
    'views/groups/members',
    'views/groups/member_proposal',
    'models/group'
], function(
    _,
    Marionette,
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
            this.group = new Model({'_id': id});
            this.group.fetch().done(function () {
                this.collabView = new CollabView({model:this.group});
                this.membersView = new MembersView({model:this.group});
                
                this.show_collab();
                
                App.eventAggregator.bind("group_tabs:show_collab", this.show_collab);
                App.eventAggregator.bind("group_tabs:show_members", this.show_members);
                App.eventAggregator.bind("group_proposals:show_member_proposal", this.show_member_proposal);
                App.eventAggregator.bind("members:show_member_proposal", this.show_member_proposal);
            }.bind(this));
        },
        
        show_collab: function() {
            App.layout.view.show(this.collabView, { preventDestroy: true });
        },
        
        show_members: function() {
            App.layout.view.show(this.membersView, { preventDestroy: true });
        },
        
        show_member_proposal: function(member_id) {
            var member = _.findWhere(this.group.get('members'), {'_id': member_id});
            
            var model = this.group;
            model.set('member',member);
            
            App.layout.view.show(
                new MembersProposalView({'model': model}),
                { preventDestroy: true });
        }
    });
    
    return Controller;
});
