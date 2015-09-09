define([
    'underscore',
    'Marionette',
    'hbs!templates/groups/members',
    'jquery',
    'bootstrap',
    'bootstrapcustom',
    'ratyfa'
], function(
    _,
    Marionette,
    Template
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        
        events: {
            'click .memb-prop-show': function(e) {
                this.trigger(
                    "members:show_member_proposal",
                    e.target.getAttribute('data-member-id'));
                
                e.preventDefault();
            }
        },
        
        initialize: function() {
            _.each(this.model.get('participants'), function(participant) {
                if(App.session.user.get('_id') == participant._id)
                    participant.is_me = true;
            });
        },
        
        onShow: function() {
            /*$('[data-toggle="popover"]').popover();*/
            $('[data-toggle="tooltip"]').tooltip();
            
            var ratySettings = {
                /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
                starOff : 'fa fa-fw fa-heart-o',
                starOn  : 'fa fa-fw fa-heart'
            };
            
            _.each(this.model.get('participants'), function(participant) {
                $('[data-rate-type="participant"][data-rate-id="'+participant._id+'"]').
                    raty(_.extend(ratySettings,
                         { score: participant.participant_rating,
                           click: _.partial(this.saveRating, this.model, 'participant') }));
                $('[data-rate-type="proposal"][data-rate-id="'+participant.ppid+'"]').
                    raty(_.extend(ratySettings,
                         { score: participant.proposal_rating,
                           click: _.partial(this.saveRating, this.model, 'proposal') }));
            }.bind(this));
        },
        
        saveRating: function(model, type, score, e) {
            var id = $(this).attr('data-rate-id');
            
            $.post('/json/ratings/rate',
                {'id': id, 'type': type, 'gid': model.get('_id'), 'score': score},
                function(data) {
                    //this.set({'votes': data, 'voted': status});
                });
        }
    });
    
    return View;
});