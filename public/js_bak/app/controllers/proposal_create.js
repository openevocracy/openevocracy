define([
    'Marionette',
    //'layouts/center_right',
    'views/proposal',
    //'views/blocks/proposal_tabs',
    'models/proposal_create',
], function(
    Marionette,
    //CenterRightLayout,
    ProposalView,
    //ProposalTabsBlock,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_proposal_index: function(tid) {
            var proposal = new Model({'tid':tid});
            
            proposal.fetch().done(function () {
                var proposalView = new ProposalView({model:proposal});
                App.layout.view.show(proposalView);
            });
        }
    });
    
    return Controller;
});
