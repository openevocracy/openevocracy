define([
    'underscore',
    'Marionette',
    'views/partials/group_events',
    'hbs!templates/groups/members',
    'jquery',
    'bootstrap',
    'bootstrapcustom',
    'ratyfa'
], function(
    _,
    Marionette,
    Events,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'members',
        viewTitle: 'Group members',
        
        events: Events,
        
        initialize: function() {
            _.each(this.model.get('participants'), function(participant) {
                if(App.session.user.get('_id') == participant._id)
                    participant.is_me = true;
            });
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onShow: function() {
            setActive('grpmem');
            
            /*$('[data-toggle="popover"]').popover();*/
            $('[data-toggle="tooltip"]').tooltip();
            
            var ratySettings = {
                /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
                starOff : 'fa fa-fw fa-heart-o',
                starOn  : 'fa fa-fw fa-heart'
            };
            
            _.each(this.model.get('participants'), function(participant) {
                // TODO partcipants => members
                $('[data-rate-type="participant"][data-rate-id="'+participant._id+'"]').
                    raty(_.extend(ratySettings,
                         { score: participant.participant_rating,
                           click: _.partial(this.saveRating, this.model, 'user') }));
                $('[data-rate-type="proposal"][data-rate-id="'+participant.ppid+'"]').
                    raty(_.extend(ratySettings,
                         { score: participant.proposal_rating,
                           click: _.partial(this.saveRating, this.model, 'proposal') }));
            }.bind(this));
        },
        
        saveRating: function(model, type, score, e) {
            var id = $(this).attr('data-rate-id');
            
            // modify internal model
            if(type == 'user')
                _.findWhere(model.get('participants'),{'_id': id}).participant_rating = score;
            else if(type == 'proposal')
                _.findWhere(model.get('participants'),{'ppid': id}).proposal_rating = score;
            
            // send to server
            $.post('/json/ratings/'+type+'/rate',
                {'id': id, 'gid': model.get('_id'), 'score': score},
                function(data) {});
        }
    });
    
    return View;
});