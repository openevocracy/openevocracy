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
                if($("#signup-form").parsley().validate()){
                    App.session.signup({
                        email: this.$("#email").val(),
                        pass: this.$("#pass").val()
                    }, {
                    success: function(res){
                        $('.message').addClass("alert alert-success").html(res.responseJSON.message);
                        $("#signup-form").remove();
                        $("#signup").remove();
                    },
                    error: function(xhr, err){
                        $('.message').addClass("alert alert-danger").html(xhr.responseJSON.message);
                        e.preventDefault();
                    }});
                } else {
                    // Clientside validation invalid
                    $('.message').addClass("alert alert-danger").html("Please check the form for mistakes.");
                }
            }
        }
    });
    
    return View;
});