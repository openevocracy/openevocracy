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
                
                topics.fetch().done(function () {
                    /* ### LEFT ### */
                    var naviView = new NaviView();
                    /*console.log(sidebar);*/
                    App.layout.sidebar.show(naviView);
                    
                    /* ### CONTENT RIGHT ### */
                    var view = new TopicsView({collection: topics});
                    App.layout.view.show(view);
                });
            }
        });
        
        return Controller;
    }
);
