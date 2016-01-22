define([
    'underscore_string',
    'jquery',
    'Marionette',
    'etherpad',
    'hbs!templates/topics/details',
    'constants',
    'jquerycookie',
    'jquerycountdown'
], function(
    _,
    $,
    Marionette,
    etherpad,
    Template,
    C
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "topic-details",
        
        events: {
            /*'click .open-desc': function(e) {
                //alert(ht);
                $('#body').animate({height: ht + 'px'}, 500 );
                $('.open-desc').slideUp(250);
            },*/
            'click .edit': function(e) {
                if($('.edit').hasClass('active')) {
                    $('.edit').removeClass('active');
                    $('.edit span').removeClass('fa-floppy-o');
                    $('.edit span').addClass('fa-pencil');
                    $('.edit').prop('title', 'edit');
                    // etherpad
                    $('#editor').find('iframe').remove();
                    // title
                    this.model.set('title', $('#titleInput').val());
                    var titleHeading = '<h2 id="topic-title">'+this.model.get('title')+'</h2>';
                    $('#titleInput').replaceWith(titleHeading);
                    
                    // bidirectional server-sync
                    // view will rerender automatically due to model change-event
                    this.model.save();
                } else {
                    $('.edit').addClass('active');
                    $('.edit span').addClass('fa-floppy-o');
                    $('.edit span').removeClass('fa-pencil');
                    $('.edit').prop('title', 'leave editor mode and save changes');
                    // etherpad
                    $('#body').hide();
                    //$('.open-desc').hide();
                    $('#editor').pad({
                        'padId': this.model.get('pid'),
                        'height' : 400,
                        'noColors' : true,
                        'borderStyle' : 'none',
                        'showControls' : true
                    });
                    // title
                    var inputField = '<input id="titleInput" class="simple-input" type="text" value="'+this.model.get('title')+'"></input>';
                    $('#topic-title').replaceWith(inputField);
                }
            },
            'click .del': function(e) {
                var warning = 'Delete topic "'+this.model.get('title')+'"?';
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
            
            this.model.set(C);
            this.model.set('title', this.model.get('name'));
            this.setSubtitle();
            // render on change
            this.model.on('change', this.render, this);
            
            var body = this.model.get('body');
            var error = 'Error';
            if(_.startsWith(body, error)) {
                this.model.set('body', '');
                this.model.set('message', body);
                this.model.set('message-type','alert alert-danger');
            }
            
            // FIXME is the following correct?
            
            var stage = this.model.get('stage');
            if( stage == C.STAGE_PROPOSAL || (stage == C.STAGE_CONSENSUS &&
            typeof this.model.get('ppid') !== undefined)) {
                this.model.set('showTabs', true);
                this.model.set('showProp', true);
            }
            
            if( stage == C.STAGE_CONSENSUS &&
            (typeof this.model.get('gid' ) !== undefined ||
            typeof this.model.get('gid' ) !== null)) {
                this.model.set('showTabs', true);
                this.model.set('showProp', true);
            }
                
        },

        onRender: function() {
            this.onAction();
            
            /*ht = $('#body').height();
            if(ht > 300) {
                $('#body').height(200);
                $('.open-desc').css("display", "block");
            }*/
        },
        
        onShow: function() {
            this.onAction();
        },
        
        onAction: function() {
            //var date = Date.now() + (7*24*3600*1000);
            var date = this.model.get('nextDeadline');
            $('#timeremaining').countdown(date, function(event) {
                $(this).html(event.strftime('%D:%H:%M:%S'));
            });
        },
        
        setSubtitle: function() {
            // set variables
            var stage = this.model.get('stage');
            var subtitle_begin = this.model.get('stageName') + ' stage';
            var subtitle_level = ' in level ' + this.model.get('level');
            var subtitle_remaining = ' in <span id="timeremaining"></span>';
            
            // evaluate conditions
            var subtitle = subtitle_begin + ((stage == C.STAGE_CONSENSUS) ? subtitle_level : '' ) + ', next ' + ((stage == C.STAGE_CONSENSUS) ? 'level' : 'stage') + subtitle_remaining;
            
            // set model
            this.model.set('subtitle',subtitle);
        }
    });
    
    return View;
});
