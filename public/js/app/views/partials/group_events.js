define([
], function(
    ) {
    
    var events = {
        'click [data-link="ourprop"]': function(e) {
            App.eventAggregator.trigger("group_tabs:show_collab");
        },
        'click [data-link="grpmem"]': function(e) {
            App.eventAggregator.trigger("group_tabs:show_members");
        },
        'click .member-proposal': function(e) {
            App.eventAggregator.trigger(
                "members:show_member_proposal",
                e.target.getAttribute('data-member-id'));
        }
    }
    
    return events;
});