define([
    'underscore',
    'Marionette',
    'views/partials/group_events',
    'hbs!templates/groups/members',
    'constants',
    'jquery',
    '../../utils',
    'bootstrap',
    'bootstrapcustom',
    'ratyfa'
], function(
    _,
    Marionette,
    Events,
    Template,
    C,
    $,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'members',
        viewTitle: 'Group members',
        
        events: Events,
        
        initialize: function() {
            _.each(this.model.get('members'), function(member) {
                if(App.session.user.get('_id') == member._id)
                    member.is_me = true;
            });
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onShow: function() {
            // Set active links
            u.setActive('grpmem');
            //u.setActive('nav-'+this.model.get('_id'));
            
            // Activate Bootstrap Tooltip
            $('[data-toggle="tooltip"]').tooltip();
            
            // Set settings for raty library
            var ratySettings = {
                /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
                starOff : 'fa fa-fw fa-heart-o',
                starOn  : 'fa fa-fw fa-heart'
            };
            
            // Create raty objects and connect them to DOM using jquery
            _.each(this.model.get('members'), function(member) {
                $('[data-rate-type="integration"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(ratySettings,
                         { score: member.rating_integration,
                           click: _.partial(this.saveRating, this.model, C.RATING_INTEGRATION) }));
                $('[data-rate-type="knowledge"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(ratySettings,
                         { score: member.rating_knowledge,
                           click: _.partial(this.saveRating, this.model, C.RATING_KNOWLEDGE) }));
            }.bind(this));
        },
        
        saveRating: function(model, type, score, e) {
            var id = $(this).attr('data-rate-id');
            
            // modify internal model
            switch (type) {
                case C.RATING_INTEGRATION:
                    _.findWhere(model.get('members'),{'_id': id}).rating_integration = score;
                    break;
                case C.RATING_KNOWLEDGE:
                    _.findWhere(model.get('members'),{'_id': id}).rating_knowledge = score;
                    break;
            }
            /*if(type == 'user')
                _.findWhere(model.get('members'),{'_id': id}).member_rating = score;
            else if(type == 'knowledge')
                _.findWhere(model.get('members'),{'ppid': id}).knowledge_rating = score;*/
            
            // send to server
            $.post('/json/ratings/rate',
                {'id': id, 'gid': model.get('_id'), 'type': type, 'score': score},
                function(data) {});
        }
    });
    
    return View;
});