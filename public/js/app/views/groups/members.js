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
            'click .memb-prop': function(e) {
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
            
            $('.rate').raty({
                /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
                starOff : 'fa fa-fw fa-heart-o',
                starOn  : 'fa fa-fw fa-heart'
            });
            
            _.each(this.model.get('participants'), function(participant) {
                $('[data-rate-type="participant"][data-member-id="'+participant._id+'"]').raty({ score: participant.participant_rating });
                $('[data-rate-type="proposal"][data-member-id="'+participant._id+'"]').raty({ score: participant.proposal_rating });
            });
            
            var that = this;
            $('[data-rate-type="participant"]').raty({
                click: function(score, e) {
                    var pid = $(this).attr('data-member-id');
                    
                    $.post('/json/ratings/rate',
                        {'id': pid, 'gid': that.model.get('_id'), 'score': score},
                        function(data) {
                            //this.set({'votes': data, 'voted': status});
                        });
                }});
        }
    });
    
    return View;
});