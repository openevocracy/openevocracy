define([
    'jquery',
    'configs',
    'application',
    'Marionette',
    'hbs!templates/proposal',
    'i18n!nls/lang',
    'views/pad'
], function(
    $,
    cfg,
    app,
    Marionette,
    Template,
    i18n,
    Pad
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "proposal",
        viewTitle: i18n["My proposal"],
        
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
        
        initialize: function() {
            this.model.set('minwords', cfg.MIN_WORDS_PROPOSAL)
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
            
            var words = this.editor.getText().split(/\s+\b/).length;
            if(words >= cfg.MIN_WORDS_PROPOSAL) {
                $('.valid').addClass('accepted').attr("title", "proposal requirements fulfilled");
                $('.valid span').removeClass('fa-ban');
                $('.valid span').addClass('fa-check');
            } else { 
                $('.valid').removeClass('accepted')
                           .attr("title", "proposal requirements not fulfilled, " +
                           (cfg.MIN_WORDS_PROPOSAL-words) + " more words required");
                $('.valid span').removeClass('fa-check');
                $('.valid span').addClass('fa-ban');
            }
        }
    });
    
    return View;
});
