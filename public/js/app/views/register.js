define([
    'i18n!nls/lang',
    'Marionette',
    'hbs!templates/register',
    'collections/users',
    'jquery',
    'parsley'
    ], function(
    i18n,
    Marionette,
    Template,
    Collection,
    $,
    Parsley
    ) {
    var users = new Collection();
    
    var Model = Backbone.Spark.Model.extend({
        sparks: {
            title: function() {
                return i18n['Register'];
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
                        $('.message').addClass("alert alert-success").html(res.message);
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
        },
    });
    
    return View;
});