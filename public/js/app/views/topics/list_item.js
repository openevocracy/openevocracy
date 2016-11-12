define([
    'jquery',
    'Marionette',
    'hbs!templates/topics/list_item',
    'constants',
    '../utils'
], function(
    $,
    Marionette,
    Template,
    C,
    u
    ) {
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'div',
        className: 'list-group-item',
        
        events: {
            'click .del': function() {
                this.model.destroy();
            },
            // toggle join
            'click .join': function(e) {
                e.stopPropagation();
                e.preventDefault();
                // if we have already joined then unjoin (leave after join)
                this.model.setJoined(!this.model.get('joined'));
            },
            // toggle vote
            'click .vote': function(e) {
                e.stopPropagation();
                e.preventDefault();
                // if we have already voted then unvote
                this.model.setVoted(!this.model.get('voted'));
            },
            'click .participate': function(e) {
                e.stopPropagation();
                e.preventDefault();
            },
            'click .doc': function(e) {
                e.stopPropagation();
            },
            'click .edit': function(e) {
                $(".topic-id").val(this.model.get('_id'));
                $(".topic-name").val(this.model.get('name'));
                $(".topic-desc").val(this.model.get('desc'));
                
                $(".lightbox").fadeIn(500);
            },
            'click .cancel': function(e) {
                this.$(".lightbox").fadeOut(500);
                this.$(".topic-name").val("");
                this.$(".topic-desc").val("");
            },
            'click .link': function(e) {
                window.location.href='/#/topic/'+this.model.get('_id');
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
        
        initialize: function() {
            // append model
            this.model.set(C); // append constants to model
            this.model.set('creationDate', this.formatDate(this.model.get('timeCreated')));
            this.model.set('proposalDate', this.formatDate(this.model.get('stageProposalStarted')));
            this.model.set('consensusDate', this.formatDate(this.model.get('stageConsensusStarted')));
            this.model.set('passedDate', this.formatDate(this.model.get('stagePassedStarted')));
            this.model.set('rejectedDate', this.formatDate(this.model.get('stageRejectedStarted')));
            this.model.on('change', this.render, this);
        },
        
        onShow: function() {
            //var date = Date.now() + (7*24*3600*1000);
            if(this.model.get('stage') != C.STAGE_SELECTION) {
                var date = this.model.get('nextDeadline');
                $("#timeremaining-"+this.model.get('_id')).countdown(date)
                .on('update.countdown', function(event) { $(this)
                .html(event.strftime(u.i18n("%D days, %H:%M:%S"))); });
                //.on('finish.countdown', function(event) { this.model.fetch(); }.bind(this));
                // FIXME Register model on-change event handler that resets the countdown when a new model is loaded.
            }
        }
    });
    
    return View;
});
