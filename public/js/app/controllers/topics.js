define([
    'Marionette',
    'views/blocks/navigation',
    'views/topics/list'
], function(
        Marionette,
        NaviView,
        TopicsView
        ) {
        var Controller = Marionette.Controller.extend({
            route_topics_index: function() {
                /* ### LEFT ### */
                var naviView = new NaviView();
                App.layout.sidebar.show(naviView);
                
                /* ### CONTENT RIGHT ### */
                var view = new TopicsView();
                App.layout.view.show(view);
            }
        });
        
        return Controller;
    }
);
