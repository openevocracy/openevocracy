define([
    'application',
    'underscore',
    'Marionette',
    'hbs!templates/topics/list',
    'views/topics/list-item',
    'models/topic',
    'collections/topics'
    ], function(
    app,
    _,
    Marionette,
    Template,
    ChildView,
    Model,
    Collection
    ) {
    var topics = new Collection();
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: topics,
        
        childView: ChildView,
        childViewContainer: '#topic-list',
        
        events: {
            'click .add': function(e) {
                if(e) e.preventDefault();
                this.$('.topic-id').val("");
                this.$('.topic-name').val("");
                
                this.$(".lightbox").fadeIn(500);
            },
            'click .save': function(e) {
                if(e) e.preventDefault();
                
                var topic;
                var newtopic=false;
                if(this.$('.topic-id').val()) { // TODO can be removed, only creation is needed here
                    // if topic already exists -> edit
                    topic = topics.get(this.$('.topic-id').val());
                    topic.set({
                        name: this.$('.topic-name').val()
                    });
                } else {
                    // if topic is new -> create
                    var Model = this.collection.model;
                    topic = new Model({
                        name: this.$('.topic-name').val()
                    });
                    newtopic=true;
                }
                //check if edited model is valid before performing changes
                topic.save({}, {
                    wait: true,
                    success: function(model,res) {
                        if(!res._id) {
                            alert("Couldn't create topic! Topic name already exists.");
                            return;
                        }
                        topic.set(res);
                        if(newtopic) topics.add(topic);
                    }.bind(this)
                });
                this.$('.lightbox').fadeOut(500);
                this.render();
            },
            'click .cancel': function(e) {
                if(e) e.preventDefault();
                this.$('.lightbox').fadeOut(500);
            }/*,
            'click .lightbox': function(e) {
                this.$(".lightbox").fadeOut(500);
            },
            'click .inner-lightbox': function(e) {
                event.stopPropagation();
            }*/
        },
        
        initialize: function() {
            _.bindAll(this, 'onDestroyTopic');
            app.eventAggregator.bind('destroyTopic', this.onDestroyTopic);
        },
        
        onBeforeRender: function() {
            topics.fetch();
        },
        
        onDestroyTopic: function(topic) {
            topics.remove(topic);
        }
    });
    
    return View;
});