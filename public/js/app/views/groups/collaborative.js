define([
    'jquery',
    'Marionette',
    'etherpad',
    'hbs!templates/groups/collaborative'
], function(
    $,
    Marionette,
    etherpad,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: "content",
        id: "collaborative",
        
        onShow: function() {
            $('#editor').pad({
                'padId': this.model.get('pid'),
                'height' : 400,
                'noColors' : true,
                'borderStyle' : 'none',
                'showControls' : true
            });
        },
        
        onDestroy: function() {
        }
    });
    
    return View;
});