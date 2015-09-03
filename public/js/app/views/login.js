define([
    'Marionette',
    'hbs!templates/login'
    ], function(
    Marionette,
    Template
    ) {

    var View = Marionette.CompositeView.extend({
        template: Template,
        
        login: function (e) {
            if(this.$("#login-form")) { //.parsley('validate')){
                App.session.login({
                    name: this.$("#name").val(),
                    pass: this.$("#pass").val()
                }, {
                    success: function(mod, res){
                        App.eventAggregator.trigger('App:logged_in');
                    },
                    error: function(mod, res){
                        e.preventDefault();
                    }
                });
            } else {
                // Invalid clientside validations thru parsley
                //if(DEBUG) console.log("Did not pass clientside validation");
            }
        },
    
        events: {
            'keypress #pass': function(e) {
                if (e.which == 13) {
                    this.login(e);
                }
            },
            'click #login': function(e) {
                //if(e) e.preventDefault();
                this.login(e);
            }
        },
        
        onShow: function() {
            if(App.session.get('logged_in')) {
                console.log('status: logged in');
                $('#status').html('Online');
            }
        }
    });
    
    return View;
});