define([
    'underscore',
    'Marionette',
    'hbs!templates/topics/list',
    'views/topics/list-item',
    'models/topic',
    ], function(
    _,
    Marionette,
    Template,
    ChildView,
    Model
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        
        //viewComparator: 'stage',
        viewComparator: function(t0,t1) {
            // sort by stage number
            var s0 = t0.get('stage');
            var s1 = t1.get('stage');
            
            // special cases
            if(s0 < 0 && s1 >= 0)
                return 1;
            if(s1 < 0 && s0 >= 0)
                return -1;
            
            // normal comparison
            return (s0 < s1) ? -1 : (s0 > s1) ? 1 : 0;
        },
        
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
                
                var Model = this.collection.model;
                var topic = new Model({
                    name: this.$('.topic-name').val()
                });
                
                topic.save({}, {
                    wait: true,
                    success: function(model,res) {
                        topic.set(res);
                        this.collection.add(topic);
                        window.location.hash = '/topic/'+topic.id;
                    }.bind(this),
                    error:  function(model,res) {
                        $('.message').html('<div class="alert alert-danger">Topic creation failed!</div>');
                    }
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
            _.bindAll.apply(_, [this].concat(_.functions(this)));
            App.eventAggregator.bind('destroyTopic', this.onDestroyTopic);
            $('#nav-tpc').addClass('active'); /* FIXME more general solution? */
        },
        
        onDestroyTopic: function(topic) {
            this.collection.remove(topic);
        }
    });
    
    return View;
});