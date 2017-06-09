define([
    'jquery',
    'underscore',
    'configs',
    'application',
    'Marionette',
    'quill',
    'hbs!templates/proposal',
    'views/pad',
    '../utils'
], function(
    $,
    _,
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
                    
                    // fetch html content from server
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
                    var quill = new Quill('#editor', { theme: 'snow', placeholder: u.i18n('DEFAULT_PROPOSAL_TEXT') });
                    this.editor = quill;
                    this.pad = new Pad(pid, quill, this.onUpdateProposal.bind(this));
                }
            }
        },
        
        onShow: function() {
            // Set link in navigation to active
            u.setActive('nav-prp-'+this.model.get('tid'));
            
            // Initialite proposal state
            this.onUpdateProposal();
        },

        onUpdateProposal: function() {
            var text;
            if(_.isUndefined(this.editor))
                text = $('#body').text();
            else
                text = this.editor.getText();
            
            var words = text.split(/\s+\b/).length;
            if(words >= cfg.MIN_WORDS_PROPOSAL) {
                $('.propstate button').addClass('btn-success').removeClass('btn-danger')
                    .attr('title', u.i18n('Proposal requirements fulfilled'));
                $('.propstate button span').text(u.i18n('Proposal is valid'));
                $('.propstate i').removeClass('fa-ban');
                $('.propstate i').addClass('fa-check');
            } else { 
                $('.propstate button').addClass('btn-danger').removeClass('btn-success').attr('title',
                    u.strformat(u.i18n('proposal requirements not fulfilled, {0} more words required'),
                                (cfg.MIN_WORDS_PROPOSAL-words)));
                $('.propstate button span').text(u.i18n('Proposal is not valid'));
                $('.propstate i').removeClass('fa-check');
                $('.propstate i').addClass('fa-ban');
            }
        }
    });
    
    return View;
});
