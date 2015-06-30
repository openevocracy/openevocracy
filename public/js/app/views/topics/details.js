define([
    'jquery',
    'application',
    'Marionette',
    'etherpad',
    'hbs!templates/topics/details',
    'jquerycookie',
    'jquerycountdown'
], function(
    $,
    app,
    Marionette,
    etherpad,
    Template
    ) {
    
    var ht = 0;
    
    var View = Marionette.LayoutView.extend({
        template: Template,

        events: {
            'click .open-desc': function(e) {
                //alert(ht);
                $('.desc').animate({height: ht + 'px'}, 500 );
                $('.open-desc').slideUp(250);
            },
            'click .edit': function(e) {
                if($('.edit').hasClass('active')) {
                    $('.edit').removeClass('active');
                    $('.edit').prop('title', 'edit');
                    // etherpad
                    $('#editor').find('iframe').remove();
                    var fetching = this.model.fetch();
                    var that = this;
                    fetching.done(function () {
                        $('.desc').html(that.model.get('desc'));
                        $('.desc').show();
                        //$('.open-desc').show();
                    });
                    // title
                    this.model.set('name', $('#titleInput').val());
                    var titleHeading = '<h1 id="title">'+this.model.get('name')+'</h1>';
                    $('#titleInput').replaceWith(titleHeading);
                    this.model.save();
                    
                } else {
                    $('.edit').addClass('active');
                    $('.edit').prop('title', 'leave editor mode and save changes');
                    // etherpad
                    $('.desc').hide();
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
                            if(!res.deleted)
                                alert('401: Unauthorized');
                            
                            app.eventAggregator.trigger("destroyTopic", model);
                            window.location.hash = '/topics';
                    }});
                }
            },
            'click .vote': function(e) {
                // if we have already voted then unvote
                this.setVoted(!this.model.get('voted'));
            },
            'click .join': function(e) {
                // if we have already joined then unjoin (leave after join)
                this.setJoined(!this.model.get('joined'));
            },
            'click #yourprop': function(e) {
                var warning = 'You have to join the topic before you can create your proposal. Do you want to join "'+this.model.get('name')+'" now? ';
                if(!this.model.get('joined')) {
                    // if user has not joined this topic, force join
                    if(confirm(warning)) {
                        this.setJoined(1);
                        return true;
                    } else {
                        e.preventDefault();
                    }
                }
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
        },

        onRender: function() {
            this.onAction();
            
            /*ht = $('.desc').height();
            if(ht > 300) {
                $('.desc').height(200);
                $('.open-desc').css("display", "block");
            }*/
        },
        
        onShow: function() {
            this.onAction();
        },
        
        onAction: function() {
            // if user is owner, pid is in response
            if(this.model.get('pid')) {
                $('.right-pos').append('<button class="ico edit" title="edit"><span></span></button>');
                $('.right-pos').append('<button class="ico del" title="delete"><span></span></button>');
            }
            
            //var date = Date.now() + (7*24*3600*1000);
            var date = this.model.get('nextStageDeadline');
            $('#timeremaining').countdown(date, function(event) {
                $(this).html(event.strftime('%D:%H:%M:%S'));
            });
        },
        
        setVoted: function(status) {
            $.post(status ? '/json/topic-vote' : '/json/topic-unvote',
               {'tid':this.model.get('_id')},
               function(data,status) {
                   this.model.set('votes',data);
                   this.model.set('voted',status);
                   this.model.fetch();
                   $('.vote').toggleClass('active');
               }.bind(this));
        },
        
        setJoined: function(status) {
            $.post(status ? '/json/topic-join' : '/json/topic-unjoin',
               {'tid':this.model.get('_id')},
               function(data,status) {
                   this.model.set('participants',data);
                   this.model.set('joined',status);
                   this.model.fetch();
                   $('.join').toggleClass('active');
               }.bind(this));
        }
    });
    
    return View;
});
