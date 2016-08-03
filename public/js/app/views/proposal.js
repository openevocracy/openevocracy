define([
    'jquery',
    'application',
    'Marionette',
    'hbs!templates/proposal',
    'views/pad'
], function(
    $,
    app,
    Marionette,
    Template,
    Pad
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
                    // pad
                    $('#body').removeClass("hidden");
                    $('.editor-wrapper').addClass("hidden");
                    $('.docstate').addClass("hidden");
                    this.model.fetch().done(function () {
                        $('#body').html(this.model.get('body'));
                        //$('#body').show();
                    }.bind(this));
                    //this.render();
                    
                } else {
                    $('.edit').addClass('active');
                    $('.edit span').addClass('fa-floppy-o');
                    $('.edit span').removeClass('fa-pencil');
                    $('.edit').prop('title', 'leave editor mode and save changes');
                    // pad
                    $('.editor-wrapper').removeClass("hidden");
                    $('#body').addClass("hidden");
                    $('.docstate').removeClass("hidden");
                }
            }
        },
        
        onShow: function() {
            //setActive('nav-'+this.model.get('_id'));
            
            // initalize pad
            Pad.onShow.bind(this)();
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        }
    });
    
    return View;
});
