define([
    'underscore',
    'underscore_string',
    'jquery',
    'Marionette',
    'moment',
    'hbs!templates/topics/details',
    'constants',
    'views/pad',
    '../../utils',
    'jquerycookie',
    'jquerycountdown'
], function(
    _,
    __,
    $,
    Marionette,
    moment,
    Template,
    C,
    Pad,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "topic-details",
        loaded: false,
        
        modelEvents: {
            'change:body': 'render'
        },
        
        events: {
            'click .edit': function(e) {
                if($('.edit').hasClass('btn-warning')) {
                    // currently in editor, save content
                    $('.edit').removeClass('btn-warning').addClass('btn-primary');
                    $('.edit span').removeClass('fa-floppy-o').addClass('fa-pencil');
                    $('.edit').prop('title', u.i18n('Edit'));
                    // remove editor, show html content
                    $('#body').removeClass("hidden");
                    $('.editor-wrapper').addClass("hidden");
                    // title field to heading
                    this.model.set('name', $('#titleInput').val());
                    var titleHeading = '<h2 class="topic-title">'+this.model.get('name')+'</h2>';
                    $('#titleInput').replaceWith(titleHeading);
                    
                    // bidirectional server-sync
                    // view will rerender automatically due to model change-event
                    this.model.save();
                } else {
                    // currently in body, open editor
                    $('.edit').removeClass('btn-primary').addClass('btn-warning');
                    $('.edit span').removeClass('fa-pencil').addClass('fa-floppy-o');
                    $('.edit').prop('title', u.i18n('Leave editor mode and save changes'));
                    // remove html content, show editor
                    $('.editor-wrapper').removeClass("hidden");
                    $('#body').addClass("hidden");
                    // title heading to input field
                    var inputField = '<input id="titleInput" class="h2-edit" type="text" value="'+this.model.get('name')+'"></input>';
                    $('.topic-title').replaceWith(inputField);
                }
            },
            'click .del': function(e) {
                var warning = 'Delete topic "'+this.model.get('name')+'"?';
                if (confirm(warning)) {
                    this.model.destroy({
                        wait: true,
                        success: function(model, res) {
                            App.eventAggregator.trigger("destroyTopic", model);
                            // delete is a link and will automatically go to topics
                        },
                        error: function() {
                            e.preventDefault();
                        }
                    });
                }
            },
            'click .vote': function(e) {
                // if we have already voted then unvote
                this.model.setVoted(!this.model.get('voted'));
            },
            'click .join': function(e) {
                // if we have already joined then unjoin (leave after join)
                this.model.setJoined(!this.model.get('joined'));
            }
        },
        
        initialize: function() {
            this.model.set(C, {silent: true});
            
            // Levels
            var levels = this.model.get('levels');
            this.model.set('levels', levels.reverse(), {silent: true});
            this.model.set('maxlevel', _.size(levels), {silent: true});
            
            // Set subtitle, requires that appendStageName was called before
            this.setSubtitle();
            
            var body = this.model.get('body');
            var error = 'Error';
            if(__.startsWith(body, error)) {
                this.model.set('body', '', {silent: true});
                this.model.set('message', body, {silent: true});
                this.model.set('message-type','alert alert-danger', {silent: true});
            }
        },

        onRender: function() {
            if(this.loaded)
                this.onDOMexists();
        },
        
        onShow: function() {
            this.onDOMexists();
            this.loaded = true;
            
            // Set link in navigation to active
            u.setActive('nav-tpc-'+this.model.get('_id'));
        },
        
        onDOMexists: function() {
            // recreate pad
            Pad.onShow.bind(this)(); // binding gives access to the pad id
            
            //var date = Date.now() + (7*24*3600*1000);
            var date = this.model.get('nextDeadline');
            $('#timeremaining').countdown(date, function(event) {
                $(this).html(event.strftime(u.i18n('%D days, %H:%M:%S')));
            });
        },
        
        setSubtitle: function() {
            // set variables
            var stage = this.model.get('stage');
            var subtitle_begin = this.model.get('stageName');
            var subtitle_level = ' ' + u.i18n('in level') + ' ' + (this.model.get('level') + 1);
            var subtitle_remaining = '<span id="timeremaining"></span>';
            var subtitle_next = '';
            
            // evaluate conditions
            if(stage == C.STAGE_PASSED) {
                subtitle_next = ', ' + u.i18n('finished at') + ' ' + moment(this.model.get('stagePassedStarted')).format('YYYY-MM-DD');
            } else if(stage == C.STAGE_REJECTED) {
                var rejectedReason = this.model.get('rejectedReason');
                subtitle_next = ', ' + u.i18n(rejectedReason);
            } else if(stage == C.STAGE_SELECTION) {
                subtitle_next = ', ' + u.i18n('check for enough participants in') + ' ' + subtitle_remaining;
            } else {
                subtitle_next = ', ' + ((stage == C.STAGE_CONSENSUS) ? u.i18n('next level in') : u.i18n('next stage in')) + ': ' + subtitle_remaining;
            }
            
            var subtitle = subtitle_begin + ((stage == C.STAGE_CONSENSUS) ? subtitle_level : '' ) + subtitle_next;
            
            // set model
            this.model.set('subtitle',subtitle, {silent: true});
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});
