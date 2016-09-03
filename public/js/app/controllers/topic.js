define([
    'Marionette',
    'views/topics/details',
    'models/topic',
    'constants'
], function(
    Marionette,
    TopicView,
    Model,
    C
    ) {
    var Controller = Marionette.Controller.extend({
        route_topic_index: function(tid) {
            var topic = new Model({'_id':tid});
            topic.fetch().done(function () {
                var topicView = new TopicView({model:topic});
                App.layout.view.show(topicView);
            });
        }
    });
    
    return Controller;
});
