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
    
    var ht = 0;
    
    var View = Marionette.ItemView.extend({
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
                    $('#editor').find('iframe').remove();
                    var fetching = this.model.fetch();
                    var that = this;
                    fetching.done(function () {
                        $('.desc').html(that.model.get('desc'));
                        $('.desc').show();
                        //$('.open-desc').show();
                    });
                } else {
                    $('.edit').addClass('active');
                    $('.desc').hide();
                    //$('.open-desc').hide();
                    $('#editor').pad({
                        'padId': this.model.get('pid'),
                        'height' : 400,
                        'noColors' : true,
                        'borderStyle' : 'none',
                        'showControls' : true
                    });
                }
            },
            'click .del': function(e) {
                if (confirm('Do you really want to delete the topic "'+this.model.get('name')+'"?')) {
                    this.model.destroy({success: function(model, res) {
                        if(!res.deleted)
                            alert('Only the owner can delete the topic!');
                    }});
                    window.location.href='/#/topics';
                }
            },
            'click .vote': function(e) {
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
            'click .join': function(e) {
                e.preventDefault();
                
                if(this.model.get('joined')) {
                    // if we have already joined then unjoin (leave after join)
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
        }
    });
    
    return View;
});