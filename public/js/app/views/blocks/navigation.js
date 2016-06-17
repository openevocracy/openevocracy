define([
    'Marionette',
    'hbs!templates/blocks/navigation'
], function(
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        id: 'navigation',
        
        initialize: function() {
            //_.each(this.model.get('groups'), function(group) {
                // get topic title
                // if group timeremaining < 24h -> danger
            //});
        },
        
        onShow: function() {
            console.log(this.model.get('topics'));
        }
    });
    
    return View;
});
