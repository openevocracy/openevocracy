define([
    'Marionette',
    'constants',
    'hbs!templates/layouts/topics',
    'hbs!templates/partials/blocks/topiclist_filter',
    'views/blocks/navigation',
    'views/topics/list',
    'collections/topics'
], function(
        Marionette,
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
            
            events: {
                'click .stage': function(e) {
                    var $el = this.$(e.target);
                    this.view.selectStage($el.val(), $el.is(":checked"));
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
                
                topics.fetch().done(function () {
                    /* ### CONTENT RIGHT ### */
                    var view = new TopicsView({collection: topics});
                    topicsLayoutView.showChildView('view', view);
                    var filter = new FilterView();
                    filter.view = view;
                    topicsLayoutView.showChildView('filter', filter);
                });
            }
        });
        
        return Controller;
    }
);
