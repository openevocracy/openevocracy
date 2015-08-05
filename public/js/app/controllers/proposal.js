define([
    'Marionette',
    'layouts/center_right',
    'views/blocks/navigation',
    'views/proposal',
    'views/blocks/proposal_tabs',
    'models/proposal',
], function(
    Marionette,
    CenterRightLayout,
    NaviView,
    ProposalView,
    ProposalTabsBlock,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_proposal_index: function(tid) {
            var proposal = new Model({'tid':tid});
            
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            proposal.fetch().done(function () {
                var proposalView = new ProposalView({model:proposal});
                centerRightLayout.center.show(proposalView);
                
                $('#right').append('<div id="proposal-tabs"></div>');
                centerRightLayout.addRegion('proposal_tabs','#proposal-tabs');
                var proposalTabsBlock = new ProposalTabsBlock({model:proposal});
                centerRightLayout.proposal_tabs.show(proposalTabsBlock);
            });
        }
    });
    
    return Controller;
});