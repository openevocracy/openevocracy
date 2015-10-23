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
            
            /* ### CONTENT RIGHT ### */
            //var centerRightLayout = new CenterRightLayout();
            //App.layout.view.show(centerRightLayout);
            
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                App.layout.view.show(topicView);
                
                /*$('#right').append('<div id="topic-tabs"></div>');
                centerRightLayout.addRegion('topic_tabs','#topic-tabs');
                var topicTabsBlock = new TopicTabsBlock({model:topic});
                //topicTabsBlock.bind("group_tabs:show_collab", this.show_collab);
                //topicTabsBlock.bind("group_tabs:show_members", this.show_members);
                centerRightLayout.topic_tabs.show(topicTabsBlock);
                
                $('#right').append('<div id="statistics"></div>');
                centerRightLayout.addRegion('statistics','#statistics');
                centerRightLayout.statistics.show(new StatisticsView({model:topic}));*/
            });
        }
    });
    
    return Controller;
});
