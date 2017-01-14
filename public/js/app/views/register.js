define([
    'Marionette',
    'hbs!templates/register',
    'collections/users',
    'jquery',
    'parsley',
    '../utils'
    ], function(
    Marionette,
    Template,
    Collection,
    $,
    Parsley,
    u
    ) {
    //var users = new Collection();
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        //collection: users,
        modelEvents: {
            'change:alert': 'render'
        },
        
        events: {
            'keypress #pass': function(e) {
                if (e.which == 13)
                    this.register(e);
            },
            'click #signup': function(e) {
                this.register(e);
            }
        },
        
        register: function(e) {
            $('.welcome-message').remove();
            if($("#signup-form").parsley().validate()){
                App.session.signup({
                    email: this.$("#email").val(),
                    pass: this.$("#pass").val()
                }, {
                success: function(res){
                    this.model.set('alert', u.i18nAlert(res.alert));
                    $("#signup-form").remove();
                    $("#signup").remove();
                }.bind(this),
                error: function(xhr, err){
                    this.model.set('email', this.$("#email").val());
                    this.model.set('alert', u.i18nAlert(xhr.responseJSON.alert));
                    e.preventDefault();
                }.bind(this)});
            } else {
                // Clientside validation invalid
                this.model.set('email', this.$("#email").val());
                this.model.set('alert', u.i18nAlert({'type': 'danger', 'content': 'Please check the form for mistakes.'}));
            }
        }
    });
    
    return View;
});