define([
    'Marionette',
    'views/topics/details',
    'layouts/blocks',
    'views/blocks/myproposal',
    'views/blocks/statistics',
    'models/topic',
    'constants'
], function(
    Marionette,
    TopicView,
    BlocksLayout,
    MyProposalView,
    StatisticsView,
    Model,
    C
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var topic = new Model({_id:id});
            
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                App.layout.view.show(topicView);
                
                if(C.STAGE_PROPOSAL == topic.get('stage')) {
                    $('#blocks').append('<div id="myproposal"></div>');
                    topicView.addRegion('myproposal','#myproposal');
                    topicView.myproposal.show(new MyProposalView({model:topic}));
                }
                
                $('#blocks').append('<div id="statistics"></div>');
                topicView.addRegion('statistics','#statistics');
                topicView.statistics.show(new StatisticsView({model:topic}));
            });
        }
    });
    
    return Controller;
});
