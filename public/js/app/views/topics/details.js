define([
    'jquery',
    'Marionette',
    'hbs!templates/topics/details',
    'views/pad',
    '../../utils',
    'jquerycookie',
    'jquerycountdown'
], function(
    $,
    Marionette,
    Template,
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
            'change': 'render'
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
                    var name = $('#titleInput').val();
                    //this.model.set('name', $('#titleInput').val());
                    var titleHeading = '<h2 class="topic-title">'+name+'</h2>';
                    $('#titleInput').replaceWith(titleHeading);
                    
                    // bidirectional server-sync
                    // view will rerender automatically due to model change-event
                    this.model.save({'name': name}, {patch: true});
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
            }
        },
        
        initialize: function() {
            //this.model.on('change', this.render, this);
            
            // Append derived model values
            this.model.updateDerivedBasic();
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
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});
