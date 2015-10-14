define([
    'Marionette',
    'handlebars',
    'hbs!templates/layouts/center_right',
    'text!partials/center_right/header.html',
    'text!partials/center_right/buttons.html'
], function(
    Marionette,
    Handlebars,
    Template,
    HeaderPartial,
    ButtonsPartial
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
    
    Handlebars.registerPartial('header', HeaderPartial);
    Handlebars.registerPartial('buttons', ButtonsPartial);
    
    return Layout;
});