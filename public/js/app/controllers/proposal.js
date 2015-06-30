define([
    'Marionette',
    'views/proposal',
    'models/proposal'
], function(
    Marionette,
    ProposalView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_proposal_index: function(id) {
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
