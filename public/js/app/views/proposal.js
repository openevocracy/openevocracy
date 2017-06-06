define([
    'jquery',
    'configs',
    'application',
    'Marionette',
    'quill',
    'hbs!templates/proposal',
    'views/pad',
    '../utils'
], function(
    $,
    cfg,
    app,
    Marionette,
    Quill,
    Template,
    Pad,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'proposal',
        
        events: {
            'click .edit': function(e) {
                if($('.edit').hasClass('btn-warning')) {
                    // currently in editor, save content
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
                    
                    // destroy pad
                    this.pad.destroy();
                    
                } else {
                    // currently in body, open editor
                    $('.edit').removeClass('btn-primary').addClass('btn-warning');
                    $('.edit span').removeClass('fa-pencil').addClass('fa-floppy-o');
                    $('.edit').prop('title', u.i18n('Leave editor mode and save changes'));
                    // pad
                    $('.editor-wrapper').removeClass("hidden");
                    $('#body').addClass("hidden");
                    $('.docstate').removeClass("hidden");
                    
                    // create pad
                    var pid = this.model.get('pid');
                    var quill = new Quill('#editor', { theme: 'snow' });
                    this.editor = quill;
                    this.pad = new Pad(pid, quill, this.onUpdateDocumentState.bind(this));
                }
            }
        },
        
        onShow: function() {
            // Set link in navigation to active
            u.setActive('nav-prp-'+this.model.get('tid'));
        },

        onUpdateDocumentState: function() {
            var words = this.editor.getText().split(/\s+\b/).length;
            if(words >= cfg.MIN_WORDS_PROPOSAL) {
                $('.valid').addClass('accepted').attr('title', u.i18n('Proposal requirements fulfilled'));
                $('.valid span').removeClass('fa-ban');
                $('.valid span').addClass('fa-check');
            } else { 
                $('.valid').removeClass('accepted').attr('title',
                    u.strformat(u.i18n('proposal requirements not fulfilled, {0} more words required'),
                                (cfg.MIN_WORDS_PROPOSAL-words)));
                $('.valid span').removeClass('fa-check');
                $('.valid span').addClass('fa-ban');
            }
        }
    });
    
    return View;
});
