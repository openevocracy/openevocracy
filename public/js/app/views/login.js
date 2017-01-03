define([
    'Marionette',
    'hbs!templates/login',
    '../utils'
    ], function(
    Marionette,
    Template,
    u
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        
        login: function (e) {
            if(e) e.preventDefault();
            console.log('login');
            App.session.login({
                name: this.$("#name").val(),
                pass: this.$("#pass").val()
            }, {
                success: function(res){
                    App.eventAggregator.trigger('App:logged_in');
                },
                error: function(xhr, err){
                    $('.message').addClass("alert alert-danger").html(u.decodeServerMessage(xhr.responseJSON));
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
        }
    });
    
    return View;
});