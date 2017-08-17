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
                    
                    // fetch html content from server
                    this.model.fetch().done(function () {
                        $('#body').html(this.model.get('body'));
                    }.bind(this));
                    
                } else {
                    // currently in body, open editor
                    $('.edit').removeClass('btn-primary').addClass('btn-warning');
                    $('.edit span').removeClass('fa-pencil').addClass('fa-floppy-o');
                    $('.edit').prop('title', u.i18n('Leave editor mode and save changes'));
                    // pad
                    $('.editor-wrapper').removeClass("hidden");
                    $('#body').addClass("hidden");
                }
            }
        },
        
        onShow: function() {
            // Set link in navigation to active
            u.setActive('nav-prp-'+this.model.get('tid'));
            
            // Initialize pad
            var pid = this.model.get('pid');
            var quill = new Quill('#editor', { theme: 'snow', placeholder: u.i18n('DEFAULT_PROPOSAL_TEXT') });
            this.pad = new Pad(pid, quill, {'documentState': true});
        },
        
        onDestroy: function() {
            this.pad.destroy();
        }
    });
    
    return View;
});
