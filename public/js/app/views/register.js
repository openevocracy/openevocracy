define([
    'application',
    'Marionette',
    'hbs!templates/register',
    'collections/users',
    'jquery',
    'parsley'
    ], function(
    app,
    Marionette,
    Template,
    Collection,
    $,
    Parsley
    ) {
    var users = new Collection();

    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: users,
        
        generateUsername: function (e) {
            document.getElementById("name").value=(Math.floor(Math.random()*4294967295)).toString(16).toUpperCase();
        },
        
        events: {
            'click #signup': function(e) {
                if(this.$("#signup-form").parsley().validate()){
                    App.session.signup({
                        name: this.$("#name").val(),
                        pass: this.$("#pass").val(),
                        email: this.$("#email").val()
                    }, {
                    success: function(mod, res){
                        console.log(res); // FIXME res is undefined ??
                        App.eventAggregator.trigger('App:logged_in');
                        
                        // FIXME validation check
                        /*if(res.hasOwnProperty('validation_error'))
                            $('.message').html('<div class="alert alert-danger">'+res.validation_error+'</div>');
                        else
                            App.eventAggregator.trigger('App:logged_in');*/
                    },
                    error: function(mod, res){
                        e.preventDefault();
                        $('.message').html('<div class="alert alert-danger">An error occured, please try again.</div>');
                    }});
                } else {
                    // Invalid clientside validation
                    $('.message').html('<div class="alert alert-danger">Please check the form for mistakes.</div>');
                }
            },
            'click #again': function(e) {
                if(e) e.preventDefault();
                this.generateUsername(e);
                this.$("#signup-form").parsley().validate();
            }
        },
        
        onShow: function(e) {
           this.generateUsername(e);
        }
    });
    
    return View;
});
