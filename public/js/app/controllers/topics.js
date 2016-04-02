define([
    'Marionette',
    'constants',
    'hbs!templates/layouts/topics',
    'hbs!templates/topics/list_filter',
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
                list: "#list",
                right: "#right"
            }
        });
        var FilterView = Backbone.View.extend({
            template: FilterTemplate,
            
            events: {
                'click .stage': function(e) {
                    var $el = this.$(e.target);
                    this.listView.selectStage($el.val(), $el.is(":checked"));
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
                    var listView = new TopicsView({collection: topics});
                    topicsLayoutView.showChildView('list', listView);
                    var filterView = new FilterView();
                    filterView.listView = listView;
                    topicsLayoutView.showChildView('right', filterView);
                });
            }
        });
        
        return Controller;
    }
);
