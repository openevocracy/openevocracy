define([
    'jquery',
    'application',
    'Marionette',
    'etherpad',
    'hbs!templates/groups/collaborative'
], function(
    $,
    app,
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
            if(!this.pad) {
                $('#editor').pad({
                    'padId': this.model.get('pid'),
                    'height' : 400,
                    'noColors' : true,
                    'borderStyle' : 'none',
                    'showControls' : true
                });
                
                this.model.bind("sync", function() {}, this);
                this.pad = true;
            }
            
            /*//if($('#editor').children().length > 0) {
            if(!this.pad) {
                $('#editor').pad({
                //this.pad.pad({
                    'padId': this.model.get('pid'),
                    'height' : 400,
                    'noColors' : true,
                    'borderStyle' : 'none',
                    'showControls' : true
                });
                
                this.pad = $('#editor').clone();
            } else {
                console.log(this.pad);
                /*$(this.pad);
                this.pad.show();*/
                /*//$('#editor').html(this.pad);
                $('#editor').replaceWith(this.pad);
            }*/
        },
        
        onDestroy: function() {
            console.log('destroyed');
        }
    });
    
    return View;
});