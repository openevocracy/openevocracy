define([
    'underscore',
    'jquery',
    'Marionette',
    'hbs!templates/settings',
    'constants',
    'i18n!nls/lang',
    'parsley',
    '../utils'
], function(
    _,
    $,
    Marionette,
    Template,
    C,
    lang,
    Parsley,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "settings",
        loaded: false,
        
        modelEvents: {
            'change': 'render'
        },
        
        // Controls which form should be open by default (true = open)
        foldState: {
            email: true,
            pass: true
        },
        
        events: {
            'click .btn-setting': function(e) {
                e.preventDefault();
                var $form = $(e.target).toggleClass('active');
                
                // Show/hide form and toggle active class
                $form.siblings('form').slideToggle();
                
                // Set foldState object, containing the fold state of the form
                var key = $form.data('type');
                this.foldState[key] = !this.foldState[key];
                
            },
            'click .btn-save': function(e) {
                e.preventDefault();
                var $form = $(e.target).parents('form');
                
                // // !! Following is for testing purpose, it ignores client validation !!
                // if($form.data('type') == "email") {
                //     this.model.save({'email': this.$('#email').val()}, {patch: true});
                // }
                // if($form.data('type') == 'pass') {
                //     this.model.save({'pass': this.$('#pass').val()}, {patch: true});
                // }
                
                // If email was changed
                if($form.data('type') == 'email') {
                    var email = this.$('#email').val();
                    if($form.parsley().validate()) {
                        this.model.save({'email': email}, {patch: true});
                    } else {
                        this.model.set('alert', u.i18nAlert({'type': 'danger', 'content': 'USER_FORM_VALIDATION_ERROR_EMAIL'}));
                        this.$('#email').val(email);
                    }
                }
                
                // If password was changed
                if($form.data('type') == 'pass') {
                    // Check if passwords match
                    if($('#pass').val() == $('#pass-rep').val()) {
                        if($form.parsley().validate())
                            this.model.save({'pass': this.$('#pass').val()}, {patch: true});
                        else
                            this.model.set('alert', u.i18nAlert({'type': 'danger', 'content': 'USER_FORM_VALIDATION_ERROR_PASSWORD'}));
                    } else {
                        this.model.set('alert', u.i18nAlert({'type': 'danger', 'content': 'The passwords you entered are not the same.'}));
                    }
                }
            }
        },
        
        initialize: function() {},
        
        onRender: function() {
            if(this.loaded)
                this.onDOMexists();
        },
        
        onShow: function() {
            this.onDOMexists();
            this.loaded = true;
        },
        
        onDOMexists: function() {
            // Open forms which should be opend by default
            _.mapObject(this.foldState, function(val, key) {
                if(val) $('[data-type="'+key+'"]').toggle().siblings('button').toggleClass('active');
            });
        }
    });
    
    return View;
});