define([
    'Marionette',
    'views/topics/list'
], function(
    Marionette,
    TopicsView
    ) {
    var Controller = Marionette.Controller.extend({
        route_topics_index: function() {
            var view = new TopicsView();
            App.layout.content.show(view);
        }
    });
    
    return Controller;
    });
