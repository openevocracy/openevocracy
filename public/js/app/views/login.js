define([
    'i18n!nls/lang',
    'Marionette',
    'hbs!templates/login',
    '../utils'
    ], function(
    i18n,
    Marionette,
    Template,
    utils
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        viewTitle: i18n["Login"],
        
        login: function (e) {
            App.session.login({
                name: this.$("#name").val(),
                pass: this.$("#pass").val()
            }, {
                success: function(res){
                    App.eventAggregator.trigger('App:logged_in');
                },
                error: function(xhr, err){
                    $('.message').addClass("alert alert-danger").html(utils.decodeServerMessage(xhr.responseJSON));
                    if(e) e.preventDefault();
                }
            });
        },
        
        events: {
            'keypress #pass': function(e) {
                if (e.which == 13)
                    this.login(e);
            },
            'click #login-btn': function(e) {
                this.login(e);
            }
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        }
    });
    
    return View;
});