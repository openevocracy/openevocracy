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
    var users = new Collection();
    
    var Model = Backbone.Spark.Model.extend({
        sparks: {
            title: function() {
                return u.i18n('Register');
            }
        }
    });
    
    var View = Marionette.CompositeView.extend({
        template: Template,
        collection: users,
        model: new Model(),
        
        events: {
            'click #signup': function(e) {
                $('.welcome-message').remove();
                if($("#signup-form").parsley().validate()){
                    App.session.signup({
                        email: this.$("#email").val(),
                        pass: this.$("#pass").val()
                    }, {
                    success: function(res){
                        $('.message').addClass("alert alert-success").html(u.decodeServerMessage(res));
                        $("#signup-form").remove();
                        $("#signup").remove();
                    },
                    error: function(xhr, err){
                        $('.message').addClass("alert alert-danger").html(u.decodeServerMessage(xhr.responseJSON));
                        e.preventDefault();
                    }});
                } else {
                    // Clientside validation invalid
                    $('.message').addClass("alert alert-danger").html("Please check the form for mistakes.");
                }
            }
        },
    });
    
    return View;
});