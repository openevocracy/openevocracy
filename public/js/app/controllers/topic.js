define([
    'Marionette',
    'views/topics/details',
    'layouts/blocks',
    'views/blocks/myproposal',
    'views/blocks/statistics',
    'models/topic'
], function(
    Marionette,
    TopicView,
    BlocksLayout,
    MyProposalView,
    StatisticsView,
    Model
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var topic = new Model({_id:id});
            
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                App.layout.content.show(topicView);
                
                var blocksLayout = new BlocksLayout({model:topic}); // ist hier das model nötig?
                App.layout.blocks.show(blocksLayout);
                
                $('#blocklist').append('<div id="myproposal"></div>');
                blocksLayout.addRegion('myproposal','#myproposal');
                blocksLayout.myproposal.show(new MyProposalView({model:topic})); // wie kommen wir dan die ppid?
                
                $('#blocklist').append('<div id="statistics"></div>');
                blocksLayout.addRegion('statistics','#statistics');
                blocksLayout.statistics.show(new StatisticsView({model:topic}));
                
                // empty sub-layouts, wenn topic wieder verlassen wird
            });
        }
    });
    
    return Controller;
});
