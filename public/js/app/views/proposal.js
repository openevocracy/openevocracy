define([
    'jquery',
    'application',
    'Marionette',
    'hbs!templates/proposal'
], function(
    $,
    app,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "proposal",
        viewTitle: "My proposal",
        
        events: {
            'click .edit': function(e) {
                if($('.edit').hasClass('active')) {
                    $('.edit').removeClass('active');
                    $('.edit span').removeClass('fa-floppy-o');
                    $('.edit span').addClass('fa-pencil');
                    $('.edit').prop('title', 'edit');
                    // etherpad
                    $('#editor').find('iframe').remove();
                    this.model.fetch().done(function () {
                        $('.body').html(this.model.get('body'));
                        $('.body').show();
                    }.bind(this));
                    
                } else {
                    $('.edit').addClass('active');
                    $('.edit span').addClass('fa-floppy-o');
                    $('.edit span').removeClass('fa-pencil');
                    $('.edit').prop('title', 'leave editor mode and save changes');
                    // etherpad
                    $('.body').hide();
                    $('#editor').pad({
                        'padId': this.model.get('pid'),
                        'height' : 400,
                        'noColors' : true,
                        'borderStyle' : 'none',
                        'showControls' : true
                    });
                    
                }
            }
        },
        
        onShow: function() {
            console.log(this.model.attributes);
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
    });
    
    return View;
});
