define([
    'Marionette',
    'hbs!templates/login',
    'jquery',
    '../utils'
    ], function(
    Marionette,
    Template,
    $,
    u
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        
        modelEvents: {
            'change:alert': 'render'
        },
        
        events: {
            'keypress #pass': function(e) {
                if (e.which == 13)
                    this.login(e);
            },
            'click #login-btn': function(e) {
                this.login(e);
            },
            'click #verify-account': function(e) {
                e.preventDefault();
                // Get url from href of link
                var url = $('#verify-account').attr('href');
                // Ajax post to send verification link
                $.post(url).done(function(res) {
                    // Success
                    this.model.set('alert', u.i18nAlert(res.alert));
                }.bind(this)).fail(function(res) {
                    // Error
                    this.model.set('alert', u.i18nAlert(res.responseJSON.alert));
                }.bind(this));
            },
            'click .pwforgot': function(e) {
                e.preventDefault();
                // Get email from href of link
                var email = $(e.target).attr('href');
                this.openLightbox();
                this.$('.lightbox input.email').val(email);
            },
            'click .cancel': function(e) {
                if(e) e.preventDefault();
                this.closeLightbox();
            },
            'click .send-password': function(e) {
                var email = this.$('.lightbox input.email').val();
                var self = this;
                $.ajax({
                    type: 'POST',
			        contentType: 'application/json',
                    url: "/json/auth/password/"+email,
                    success: function(res) {
                        self.closeLightbox();
                        self.model.set('alert', u.i18nAlert(res.alert));
                    },
                    error: function(xhr, err) {
                        self.model.set('alert', u.i18nAlert(xhr.responseJSON.alert));
                        self.$('.lightbox input.email').val(email);
                    }
                });
            }
        },
        
        initialize: function() {
            this.model.set('lightboxOpen', false);
        },
        
        onRender: function() {
            if(this.model.get('lightboxOpen'))
                this.$('.lightbox').show();
        },
        
        openLightbox: function() {
            this.model.set('lightboxOpen', true);
            this.$('.lightbox').fadeIn(500);
        },
        
        closeLightbox: function() {
            this.model.set('lightboxOpen', false);
            this.model.unset('alert');
            this.$('.lightbox').fadeOut(500);
        },
        
        login: function(e) {
            //var self = this;
            if(e) e.preventDefault();
            App.session.login({
                name: this.$("#name").val(),
                pass: this.$("#pass").val()
            }, {
                success: function(res){
                    App.eventAggregator.trigger('App:logged_in');
                },
                error: function(xhr, err){
                    this.model.set('name', this.$("#name").val());
                    this.model.set('alert', u.i18nAlert(xhr.responseJSON.alert));
                }.bind(this)
            });
        }
    });
    
    return View;
});