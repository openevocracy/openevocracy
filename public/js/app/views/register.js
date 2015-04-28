define([
    'application',
    'Marionette',
    'hbs!templates/register',
    'collections/users'
    ], function(
    app,
    Marionette,
    Template,
    Collection
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
                if(this.$("#signup-form")/*.parsley('validate')*/){
                    app.session.signup({
                        name: this.$("#name").val(),
                        pass: this.$("#pass").val(),
                        email: this.$("#email").val()
                    }, {
                    success: function(mod, res){
                        console.log(mod);
                        
                        // Redirect
                        window.location.href = "#/topics";
                    },
                    error: function(mod, res){
                        console.log(mod);
                    }});
                } else {
                    // Invalid clientside validations thru parsley
                    console.log("Did not pass clientside validation");
                }
            },
            'click #again': function(e) {
                if(e) e.preventDefault();
                this.generateUsername(e);
            }
        },
        
        onShow: function(e) {
           this.generateUsername(e);
        }
    });
    
    return View;
});
