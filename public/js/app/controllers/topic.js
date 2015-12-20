define([
    'Marionette',
    //'layouts/center_right',
    'views/blocks/navigation',
    //'views/blocks/topic_tabs',
    'views/topics/details',
    //'views/blocks/statistics',
    'models/topic',
    'constants'
], function(
    Marionette,
    //CenterRightLayout,
    NaviView,
    //TopicTabsBlock,
    TopicView,
    //StatisticsView,
    Model,
    C
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(id) {
            var topic = new Model({_id:id});
            
            /* ### LEFT ### */
            var naviView = new NaviView();
            App.layout.sidebar.show(naviView);
            
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                App.layout.view.show(topicView);
            });
        }
    });
    
    return Controller;
});
