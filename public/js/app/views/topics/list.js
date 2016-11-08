define([
    'underscore',
    'constants',
    'Marionette',
    'hbs!templates/topics/list',
    'views/topics/list_item',
    'models/topic',
    '../../utils',
    'i18n!nls/lang'
    ], function(
    _,
    C,
    Marionette,
    Template,
    ChildView,
    Model,
    utils,
    i18n
    ) {
    
    var ListModel = Backbone.Spark.Model.extend({
        sparks: {
            title: function() {
                return i18n['Current Topics'];
            }
        }
    });
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        tagName: 'section',
        id: "topics-list",
        model: new ListModel(C),
        
        //viewComparator: 'stage',
        viewComparator: function(t0,t1) {
            // sort by stage number
            var s0 = t0.get('stage');
            var s1 = t1.get('stage');
            // sort by dea
            var d0 = t0.get('nextDeadline');
            var d1 = t1.get('nextDeadline');
            
            // special cases
            if(s0 < 0 && s1 >= 0)
                return 1;
            if(s1 < 0 && s0 >= 0)
                return -1;
            
            // normal comparison
            var stageComparison = (s0 < s1) ? -1 : (s0 > s1) ? 1 : 0;
            
            if(stageComparison != 0)
                return stageComparison;
            else {
                var deadlineComparison = (d0 < d1) ? -1 : (d0 > d1) ? 1 : 0;
                return this.deadlineSortFactor*deadlineComparison;
            };
        },
        
        childView: ChildView,
        childViewContainer: '#topic-list',
        
        events: {
            'click .refresh': function(e) {
                this.collection.fetch();
            },
            'click .add': function(e) {
                if(e) e.preventDefault();
                this.$('.topic-id').val("");
                this.$('.topic-name').val("");
                
                this.$(".lightbox").fadeIn(500);
            },
            'click .save': function(e) {
                if(e) e.preventDefault();
                this.addTopic(this.$('.topic-name').val());
            },
            'keydown .topic-name': function(e) {
                if(e.keyCode == 13) {
                    this.addTopic(this.$('.topic-name').val());
                    if(e) e.preventDefault();
                }
            },
            'click .cancel': function(e) {
                if(e) e.preventDefault();
                this.$('.lightbox').fadeOut(500);
            }
        },
        
        initialize: function() {
            _.bindAll.apply(_, [this].concat(_.functions(this)));
            App.eventAggregator.bind('destroyTopic', this.onDestroyTopic);
            
            // initialize filter/sort settings
            this.stageSelected = {"-1": false, "0": true, "1": true, "2": true, "3": true};
            this.deadlineSortFactor = 1;
            
            // create timer for automatic refreshing of list
            this.timer = setInterval(function() {
                this.collection.fetch();
            }.bind(this), 10000);
        },
        
        onDestroy: function() {
            clearInterval(this.timer);
        },
        
        onDestroyTopic: function(topic) {
            this.collection.remove(topic);
        },
        
        onShow: function() {
            setActive('topics');
        },
        
        setSortOldestFirst: function(sortOldestFirst) {
            this.deadlineSortFactor = sortOldestFirst ? 1 : -1; 
            this.render();
        },
        
        selectStage: function(stage, val) {
            this.stageSelected[stage] = val;
            this.render();
        },
        
        filter: function (child, index, collection) {
            return this.stageSelected[child.get('stage')];
        },
        
        addTopic: function(topicName) {
            if(topicName == null || topicName.trim() == "")
                return;
            
            var Model = this.collection.model;
            var topic = new Model({
                name: topicName.trim()
            });
            
            topic.save({}, {
                wait: true,
                success: function(model,res) {
                    topic.set(res);
                    this.collection.add(topic);
                    window.location.hash = '/topic/'+topic.id;
                }.bind(this),
                error: function(model,res) {
                    this.$('.message').addClass('alert alert-danger').html(utils.decodeServerMessage(res.responseJSON));
                }.bind(this)
            });
            
            this.$('.lightbox').fadeOut(500);
        }
    });
    
    return View;
});