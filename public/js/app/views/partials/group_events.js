define([
], function(
    ) {
    
    var events = {
        'click [data-link="ourprop"]': function(e) {
            App.eventAggregator.trigger("group_tabs:show_collab");
            if(e) e.preventDefault();
        },
        'click [data-link="grpmem"]': function(e) {
            App.eventAggregator.trigger("group_tabs:show_members");
            if(e) e.preventDefault();
        },
        'click .member-proposal': function(e) {
            App.eventAggregator.trigger(
                "members:show_member_proposal",
                e.target.getAttribute('data-member-id'));
            if(e) e.preventDefault();
        }
    }
    
    return events;
});