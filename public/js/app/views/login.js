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
        modelEvents: {
            'change:alert': 'render'
        },
        
        login: function (e) {
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