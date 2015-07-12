define([
    'Marionette',
    'layouts/center_right',
    'views/topics/details',
    'views/blocks/myproposal',
    'views/blocks/mygroup',
    'views/blocks/statistics',
    'models/topic',
    'constants'
], function(
    Marionette,
    CenterRightLayout,
    TopicView,
    MyProposalView,
    MyGroupView,
    StatisticsView,
    Model,
    C
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var topic = new Model({_id:id});
            
            var centerRightLayout = new CenterRightLayout();
            App.layout.view.show(centerRightLayout);
            
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                centerRightLayout.center.show(topicView);
                
                if(topic.get('stage') >= C.STAGE_PROPOSAL) {
                    $('#right').append('<div id="myproposal"></div>');
                    centerRightLayout.addRegion('myproposal','#myproposal');
                    centerRightLayout.myproposal.show(new MyProposalView({model:topic}));
                }
                
                if(topic.get('stage') == C.STAGE_CONSENSUS && typeof topic.get('gid') != 'undefined') {
                    $('#right').append('<div id="mygroup"></div>');
                    centerRightLayout.addRegion('mygroup','#mygroup');
                    centerRightLayout.mygroup.show(new MyGroupView({model:topic}));
                }
                
                $('#right').append('<div id="statistics"></div>');
                centerRightLayout.addRegion('statistics','#statistics');
                centerRightLayout.statistics.show(new StatisticsView({model:topic}));
            });
        }
    });
    
    return Controller;
});
