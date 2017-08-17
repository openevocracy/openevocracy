define([
    'jquery',
    'Marionette',
    'hbs!templates/topics/list_item',
    'constants',
    '../../utils'
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
        loaded: false,
        
        events: {
            // toggle join
            /*'click .join': function(e) {
                e.stopPropagation();
                e.preventDefault();
                // if we have already joined then unjoin (leave after join)
                this.model.setJoined(!this.model.get('joined'));
            },*/
            // toggle vote
            'click .vote': function(e) {
                e.stopPropagation();
                e.preventDefault();
                // if we have already voted then unvote
                this.model.setVoted(!this.model.get('voted'));
            },
            'click .doc': function(e) {
                e.stopPropagation();
            },
            'click .link': function(e) {
                window.location.href='/#/topic/'+this.model.get('_id');
            }
        },
        
        initialize: function() {
            // Render on change
            this.model.on('change', this.render, this);
            
            // Append derived model values
            this.model.updateDerivedBasic();
        },
        
        onBeforeRender: function() {
            // Append derived model values
            this.model.updateDerivedDate();
        },
        
        onRender: function() {
            if(this.loaded)
                this.onDOMexists();
        },
        
        onShow: function() {
            this.onDOMexists();
            this.loaded = true;
        },
        
        onDOMexists: function() {
            if(this.model.get('stage') != C.STAGE_SELECTION) {
                var date = this.model.get('nextDeadline');
                $("#timeremaining-"+this.model.get('_id')).countdown(date)
                .on('update.countdown', function(event) { $(this)
                .html(event.strftime(u.i18n('%D days, %H:%M:%S'))); });
                //.on('finish.countdown', function(event) { this.model.fetch(); }.bind(this));
                // FIXME Register model on-change event handler that resets the countdown when a new model is loaded.
            }
            
            if(this.loaded)
                $("#link-"+this.model.get('_id')).fadeTo(250, 0.3, function() { $(this).fadeTo(250, 1.0); });
        }
    });
    
    return View;
});
