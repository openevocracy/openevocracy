define([
    'backbone',
    'constants',
    '../utils',
    ], function(
    Backbone,
    C,
    u
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/topic',
        
        initialize: function() {
            var self = this;
            
            this.on('change', function() {
                this.updateDerived();
            }, this);
            
            // TODO implement with handlebars, when "participate" ("joined") is removed
            this.on('change:stage', function() {
                var stage = self.get('stage');
                var showTabs =
                (self.get('joined')) &&
                (stage == C.STAGE_PROPOSAL || stage == C.STAGE_CONSENSUS);
                self.set('showTabs', showTabs, {silent: true});
            });
        },
        
        updateDerived: function() {
            this.updateDerivedBasic();
            this.updateDerivedStatistics();
        },
        
        updateDerivedStatistics: function() {
            // TODO
        },
        
        updateDerivedBasic: function() {
            // append timeCreated
            this.set('timeCreated', u.getTimestamp(this.get('_id')), {silent: true});
            
            // append stageName
            switch (this.get('stage')) {
                case C.STAGE_REJECTED:
                    this.set('stageName', u.i18n('rejected stage'), {silent: true});
                    break;
                case C.STAGE_SELECTION:
                    this.set('stageName', u.i18n('selection stage'), {silent: true});
                    break;
                case C.STAGE_PROPOSAL:
                    this.set('stageName', u.i18n('proposal stage'), {silent: true});
                    break;
                case C.STAGE_CONSENSUS:
                    this.set('stageName', u.i18n('consensus stage'), {silent: true});
                    break;
                case C.STAGE_PASSED:
                    this.set('stageName', u.i18n('passed stage'), {silent: true});
                    break;
                default:
                    this.set('stageName', 'unknown', {silent: true});
                    break;
            }
        },
        
        setVoted: function(status) {
            $.post(status ? '/json/topic-vote' : '/json/topic-unvote',
               {'tid':this.get('_id')},
               function(data) {
                   this.set({'votes': data, 'voted': status});
               }.bind(this));
        },
        
        setJoined: function(status) {
            $.post(status ? '/json/topic-join' : '/json/topic-unjoin',
               {'tid':this.get('_id')},
               function(data) {
                   this.set({'participants': data, 'joined': status});
               }.bind(this));
        }
    });
    
    return Model;
});