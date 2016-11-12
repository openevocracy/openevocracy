define([
    'underscore',
    'Marionette',
    'views/partials/group_events',
    'hbs!templates/groups/members',
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
            u.setActive('grpmem');
            //u.setActive('nav-'+this.model.get('_id'));
            
            $('[data-toggle="tooltip"]').tooltip();
            
            var ratySettings = {
                /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
                starOff : 'fa fa-fw fa-heart-o',
                starOn  : 'fa fa-fw fa-heart'
            };
            
            _.each(this.model.get('members'), function(member) {
                // TODO partcipants => members
                $('[data-rate-type="member"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(ratySettings,
                         { score: member.member_rating,
                           click: _.partial(this.saveRating, this.model, 'user') }));
                $('[data-rate-type="knowledge"][data-rate-id="'+member.ppid+'"]').
                    raty(_.extend(ratySettings,
                         { score: member.knowledge_rating,
                           click: _.partial(this.saveRating, this.model, 'knowledge') }));
            }.bind(this));
        },
        
        saveRating: function(model, type, score, e) {
            var id = $(this).attr('data-rate-id');
            
            // modify internal model
            if(type == 'user')
                _.findWhere(model.get('members'),{'_id': id}).member_rating = score;
            else if(type == 'knowledge')
                _.findWhere(model.get('members'),{'ppid': id}).knowledge_rating = score;
            
            // send to server
            $.post('/json/ratings/'+type+'/rate',
                {'id': id, 'gid': model.get('_id'), 'score': score},
                function(data) {});
        }
    });
    
    return View;
});