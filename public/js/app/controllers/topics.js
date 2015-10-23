define([
    'Marionette',
    'views/blocks/navigation',
    'views/topics/list',
    'collections/topics'
], function(
        Marionette,
        NaviView,
        TopicsView,
        Collection
        ) {
        var Controller = Marionette.Controller.extend({
            route_topics_index: function() {
                var topics = new Collection();
                
                /* ### LEFT ### */
                var naviView = new NaviView();
                App.layout.sidebar.show(naviView);
                
                topics.fetch().done(function () {
                    /* ### CONTENT RIGHT ### */
                    var view = new TopicsView({collection: topics});
                    App.layout.view.show(view);
                });
            }
        });
        
        return Controller;
    }
);
