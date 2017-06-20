define([
    'backbone',
    'moment',
    'constants',
    '../utils',
    'underscore',
    'underscore_string'
    ], function(
    Backbone,
    moment,
    C,
    u,
    _,
    __
    ) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/topic',
        
        initialize: function() {
            var self = this;
            
            this.set(C, {silent: true});
            
            /*this.on('change', function() {
                this.updateDerived();
            }, this);*/
            
            // TODO implement with handlebars, when "participate" ("joined") is removed
            this.on('change:stage', function() {
                var stage = self.get('stage');
                var showTabs = (stage == C.STAGE_PROPOSAL || stage == C.STAGE_CONSENSUS);
                self.set('showTabs', showTabs, {silent: true});
            });
            
            this.on('change:stagePassedStarted', function() {
                self.set('stagePassedDate', moment(self.get('stagePassedStarted')).format('YYYY-MM-DD'), {silent: true});
            });
            
            this.on('change:levels', function() {
                var levels = self.get('levels');
                self.set('levels', levels.reverse(), {silent: true});
                self.set('maxlevel', _.size(levels), {silent: true});
            });
            
            // TODO Is this still the solution we want? Seems hacky!
            this.on('change:body', function() {
                var body = self.get('body');
                var error = 'Error';
                if(__.startsWith(body, error)) {
                    self.set('body', '', {silent: true});
                    self.set('message', body, {silent: true});
                    self.set('messageType','alert alert-danger', {silent: true});
                }
            });
        },
        
        updateDerived: function() {
            this.updateDerivedBasic();
            this.updateDerivedStatistics();
            this.updateDerivedDate();
        },
        
        updateDerivedDate: function() {
            this.set('creationDate', this.formatDate(this.get('timeCreated')), {silent: true});
            this.set('proposalDate', this.formatDate(this.get('stageProposalStarted')), {silent: true});
            this.set('consensusDate', this.formatDate(this.get('stageConsensusStarted')), {silent: true});
            this.set('passedDate', this.formatDate(this.get('stagePassedStarted')), {silent: true});
            this.set('rejectedDate', this.formatDate(this.get('stageRejectedStarted')), {silent: true});
        },
        
        updateDerivedStatistics: function() {
            // TODO
        },
        
        updateDerivedBasic: function() {
            this.set('timeCreated', u.getTimestamp(this.get('_id')), {silent: true});
            this.set('num_proposals', _.size(this.get('proposals')), {silent: true});
            
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
        
        leadingZero: function(num) {
            // if lenght of number is only 1, add leading 0
            num = num.toString();
            return num.length < 2 ? ("0" + num) : num;
        },
        
        formatDate: function(rawDate) {
            var date = new Date(rawDate);
            var y = date.getFullYear();
            var m = this.leadingZero(date.getMonth()+1);
            var d = this.leadingZero(date.getDate());
            var newDate = y+"-"+m+"-"+d;
            return newDate;
        },
        
        setVoted: function(status) {
            $.post(status ? '/json/topic-vote' : '/json/topic-unvote',
               {'tid':this.get('_id')},
               function(data) {
                   this.set({'num_votes': data, 'voted': status});
               }.bind(this));
        }
    });
    
    return Model;
});