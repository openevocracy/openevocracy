define([
    'Marionette',
    'hbs!templates/register',
    'collections/users',
    'jquery',
    'parsley'
    ], function(
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
        
        events: {
            'click #signup': function(e) {
                $('.welcome-message').remove();
                if(this.$("#signup-form").parsley().validate()){
                    App.session.signup({
                        pass: this.$("#pass").val(),
                        email: this.$("#email").val()
                    }, {
                    success: function(res){
                        App.eventAggregator.trigger('App:logged_in');
                    },
                    error: function(xhr, err){
                        // Serverside validation invalid
                        e.preventDefault();
                        $('.message').html('<div class="alert alert-danger">'+xhr.responseText+'</div>');
                    }});
                } else {
                    // Clientside validation invalid
                    $('.message').html('<div class="alert alert-danger">Please check the form for mistakes.</div>');
                }
            }
        }
    });
    
    return View;
});
