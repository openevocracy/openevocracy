define([
    'Marionette',
    //'collections/set',
    'constants',
    'hbs!templates/layouts/topics',
    'hbs!templates/partials/blocks/topiclist_filter',
    'views/blocks/navigation',
    'views/topics/list',
    'collections/topics'
], function(
        Marionette,
        //Set,
        C,
        TopicsLayoutTemplate,
        FilterTemplate,
        NaviView,
        TopicsView,
        Collection
        ) {
        
        var TopicsLayoutView = Marionette.LayoutView.extend({
            template: TopicsLayoutTemplate,
            
            regions: {
                view: "#view",
                filter: "#filter"
            }
        });
        var FilterView = Backbone.View.extend({
            template: FilterTemplate,
            
            //selected: new Set(),
            events: {
                'click .stage': function(e) {
                    var $el = this.$(e.target);
                    /*if($el.attr('checked'))
                        this.selected.add($el.val());
                    else
                        this.selected.remove($el.val());*/
                }
            },
            
            render: function() {
                this.$el.html(this.template(C));
                return this;
            }
        });
        
        var Controller = Marionette.Controller.extend({
            route_topics_index: function() {
                var topics = new Collection();
                
                /* ### LEFT ### */
                var naviView = new NaviView();
                App.layout.sidebar.show(naviView);
                
                var topicsLayoutView = new TopicsLayoutView();
                App.layout.view.show(topicsLayoutView);
                topicsLayoutView.showChildView('filter', new FilterView());
                
                topics.fetch().done(function () {
                    /* ### CONTENT RIGHT ### */
                    var view = new TopicsView({collection: topics});
                    topicsLayoutView.showChildView('view', view);
                });
            }
        });
        
        return Controller;
    }
);
