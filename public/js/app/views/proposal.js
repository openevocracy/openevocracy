define([
    'jquery',
    'application',
    'Marionette',
    'etherpad',
    'hbs!templates/proposal'
], function(
    $,
    app,
    Marionette,
    etherpad,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        onShow: function() {
            $('#editor').pad({
                'padId': this.model.get('pid'),
                'height' : 400,
                'noColors' : true,
                'borderStyle' : 'none',
                'showControls' : true
            });
        }
    });
    
    return View;
});
