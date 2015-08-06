define([
    'jquery',
    'Marionette',
    'etherpad',
    'hbs!templates/topics/details',
    'jquerycookie',
    'jquerycountdown'
], function(
    $,
    Marionette,
    etherpad,
    Template
    ) {
    
    //var ht = 0;
    
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
                    $('.edit').prop('title', 'edit');
                    // etherpad
                    $('#editor').find('iframe').remove();
                    /*this.model.fetch().done(function () {
                        $('#body').html(this.model.get('body'));
                        $('#body').show();
                        //$('.open-desc').show();
                    }.bind(this));*/
                    // title
                    this.model.set('name', $('#titleInput').val());
                    var titleHeading = '<h1 id="title">'+this.model.get('name')+'</h1>';
                    $('#titleInput').replaceWith(titleHeading);
                    
                    // bidirectional server-sync
                    // view will rerender automatically due to model change-event
                    this.model.save();
                } else {
                    $('.edit').addClass('active');
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
                    var inputField = '<input id="titleInput" class="simple-input" type="text" value="'+this.model.get('name')+'"></input>';
                    $('#title').replaceWith(inputField);
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
            // define new helper for template
            Handlebars.registerHelper('ifis', function(a, b, opts) {
                if(a == b) {
                    return opts.fn(this);
                } else {
                    return opts.inverse(this);
                }
            });
            
            // render on change
            this.model.on('change', this.render, this);
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
            var date = this.model.get('nextStageDeadline');
            $('#timeremaining').countdown(date, function(event) {
                $(this).html(event.strftime('%D:%H:%M:%S'));
            });
        }
    });
    
    return View;
});
