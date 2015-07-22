define([
    'Marionette',
    'views/blocks/navigation',
    'views/proposal',
    'models/proposal',
], function(
    Marionette,
    NaviView,
    ProposalView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_proposal_index: function(id) {
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            /* ### CONTENT RIGHT ### */
            var proposal = new Model({_id:id});
            var fetching = proposal.fetch();
            fetching.done(function () {
                var view = new ProposalView({model:proposal});
                App.layout.view.show(view);
            });
        }
    });
    
    return Controller;
});
