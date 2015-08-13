define([
    'Marionette',
    'handlebars',
    'hbs!templates/topics/list-item',
    'constants'
], function(
    Marionette,
    Handlebars,
    Template,
    C
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
                
                if(this.model.get('joined')) {
                    // if we have already joined then unjoin (leave again)
                    $.post('/json/topic-unjoin',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('participants',data);
                               this.model.set('joined',0);
                               this.render();
                           }.bind(this));
                } else {
                    $.post('/json/topic-join',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('participants',data);
                               this.model.set('joined',1);
                               this.render();
                           }.bind(this));
                }
            },
            // toggle vote
            'click .vote': function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                if(this.model.get('voted')) {
                    // if we have already voted then unvote
                    $.post('/json/topic-unvote',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('votes',data);
                               this.model.set('voted',0);
                               this.render();
                           }.bind(this));
                } else {
                    $.post('/json/topic-vote',
                           {'tid':this.model.get('_id')},
                           function(data,status) {
                               this.model.set('votes',data);
                               this.model.set('voted',1);
                               this.render();
                           }.bind(this));
                }
            },
            'click .participate': function(e) {
                e.stopPropagation();
                e.preventDefault();
            },
            'click .edit': function(e) {
                $(".topic-id").val(this.model.get('_id'));
                $(".topic-name").val(this.model.get('name'));
                $(".topic-desc").val(this.model.get('desc'));
                
                $(".lightbox").fadeIn(500);
            },
            // 'click .save': function(e) {
            //     // FIXME this is not being called
            //     e.preventDefault();
            //     this.model.name = this.$(".topic-name").val(),
            //     this.model.desc = this.$(".topic-desc").val(),
                
            //     this.model.save();
            // },
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
        },
        
        onShow: function() {
            //var date = Date.now() + (7*24*3600*1000);
            if(this.model.get('stage') != C.STAGE_SELECTION) {
                var date = this.model.get('nextStageDeadline');
                $("#timeremaining-"+this.model.get('_id')).countdown(date)
                .on('update.countdown', function(event) { $(this).html(event.strftime('%D:%H:%M:%S')); });
                //.on('finish.countdown', function(event) { this.model.fetch(); }.bind(this));
                // FIXME Register model on-change event handler that resets the countdown when a new model is loaded.
            }
        }
    });
    
    return View;
});
