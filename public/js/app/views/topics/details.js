define([
    'jquery',
    'Marionette',
    'quill',
    'hbs!templates/topics/details',
    'views/pad',
    'views/groupviz',
    '../../utils',
    'jquerycookie',
    'jquerycountdown'
], function(
    $,
    Marionette,
    Quill,
    Template,
    Pad,
    GroupViz,
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
                    
                    // destroy pad
                    this.pad.destroy();
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
                    
                    // create pad
                    var pid = this.model.get('pid');
                    var quill = new Quill('#editor', { theme: 'snow', placeholder: u.i18n('DEFAULT_TOPIC_TEXT') });
                    this.pad = new Pad(pid, quill);
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
        
        onBeforeRender: function() {
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
            
            // Show social share buttons
            u.showShareButtons();
        },
        
        onDOMexists: function() {
            // create groupviz
            this.groupviz = new GroupViz(this.model.get('groups'), this.model.get('proposals_'));
            
            var date = this.model.get('nextDeadline');
            $('#timeremaining').countdown(date, function(event) {
                $(this).html(event.strftime(u.i18n('%D days, %H:%M:%S')));
            }).on('finish.countdown', function(event) {
                // Update model if timer has finished
                this.model.fetch();
            }.bind(this));
        }
    });
    
    return View;
});
