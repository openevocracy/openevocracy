define([
    'Marionette',
    'jquery',
    'constants',
    '../utils',
    'hbs!templates/layouts/topics',
    'hbs!templates/topics/list_filter',
    'views/topics/list',
    'collections/topics'
], function (
        Marionette,
        $,
        C,
        u,
        TopicsLayoutTemplate,
        FilterTemplate,
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
                },
                'click .deadline': function(e) {
                    var $el = this.$(e.target);
                    this.listView.setSortOldestFirst($el.val() == "oldfirst");
                }
            },
            
            onShow: function() {
                $('aside .topic-title').text(u.i18n('Filter and sorting'));
            },
            
            render: function() {
                this.$el.html(this.template(C));
                return this;
            }
        });
        
        var Controller = Marionette.Controller.extend({
            route_topics_index: function() {
                
                var topicsLayoutView = new TopicsLayoutView();
                App.layout.view.show(topicsLayoutView);
                
                var topics = new Collection();
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
