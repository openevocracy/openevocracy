define([
    'backbone'
    ], function(
    Backbone
    ) {
    var Model = Backbone.Spark.Model.extend({
        idAttribute: '_id',
        urlRoot: '/json/topic',
        
        // TODO
        // sparks: {
        //     creationDate: function() {
        //         return this.get('timeCreated');
        //         //return this.formatDate(this.get('timeCreated'));
        //     }.dependsOn('timeCreated'),
        //     proposalDate: function() {
        //         return this.formatDate(this.get('stageProposalStarted'));
        //     }.dependsOn('stageProposalStarted'),
        //     consensusDate: function() {
        //         return this.formatDate(this.get('stageConsensusStarted'));
        //     }.dependsOn('stageConsensusStarted'),
        //     passedDate: function() {
        //         return this.formatDate(this.get('stagePassedStarted'));
        //     }.dependsOn('stagePassedStarted'),
        //     rejectedDate: function() {
        //         return this.formatDate(this.get('stageRejectedStarted'));
        //     }.dependsOn('stageRejectedStarted')
        // },
        
        // leadingZero: function(num) {
        //     // if lenght of number is only 1, add leading 0
        //     num = num.toString();
        //     return num.length < 2 ? ("0" + num) : num;
        // },
        
        // formatDate: function(rawDate) {
        //     var date = new Date(rawDate);
        //     var y = date.getFullYear();
        //     var m = this.leadingZero(date.getMonth()+1);
        //     var d = this.leadingZero(date.getDate());
        //     var newDate = y+"-"+m+"-"+d;
        //     return newDate;
        // },
        
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