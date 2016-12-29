define([
    'jquery',
    'configs',
    'application',
    'Marionette',
    'hbs!templates/proposal',
    'views/pad',
    '../utils'
], function(
    $,
    cfg,
    app,
    Marionette,
    Template,
    Pad,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "proposal",
        viewTitle: u.i18n("My proposal"),
        
        events: {
            'click .edit': function(e) {
                if($('.edit').hasClass('btn-warning')) {
                    $('.edit').removeClass('btn-warning').addClass('btn-primary');
                    $('.edit span').removeClass('fa-floppy-o').addClass('fa-pencil');
                    $('.edit').prop('title', u.i18n('Edit'));
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
                    $('.edit').removeClass('btn-primary').addClass('btn-warning');
                    $('.edit span').removeClass('fa-pencil').addClass('fa-floppy-o');
                    $('.edit').prop('title', u.i18n('Leave editor mode and save changes'));
                    // pad
                    $('.editor-wrapper').removeClass("hidden");
                    $('#body').addClass("hidden");
                    $('.docstate').removeClass("hidden");
                }
            }
        },
        
        initialize: function() {
            console.log(this.model);
            this.model.set('minwords', cfg.MIN_WORDS_PROPOSAL);
        },
        
        onShow: function() {
            // Set link in navigation to active
            u.setActive('nav-prp-'+this.model.get('tid'));
            
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
                $('.valid').addClass('accepted').attr('title', u.i18n('Proposal requirements fulfilled'));
                $('.valid span').removeClass('fa-ban');
                $('.valid span').addClass('fa-check');
            } else { 
                $('.valid').removeClass('accepted')
                           .attr('title', 'proposal requirements not fulfilled, ' +
                           (cfg.MIN_WORDS_PROPOSAL-words) + ' more words required');
                $('.valid span').removeClass('fa-check');
                $('.valid span').addClass('fa-ban');
            }
        }
    });
    
    return View;
});
