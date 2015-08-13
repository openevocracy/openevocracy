define([
    'Marionette',
    'hbs!templates/layouts/center_right'
], function(
    Marionette,
    Template
    ) {
    
    var Layout = Marionette.LayoutView.extend({
        template: Template,
        id: 'center-right',
        className: 'row',
        
        regions: {
            'center': '#center',
            'right': '#right'
        }
    });
    
    return Layout;
});