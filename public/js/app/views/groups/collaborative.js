define([
    'jquery',
    'constants',
    'underscore',
    'Marionette',
    'configs',
    'views/pad',
    'hbs!templates/groups/collaborative',
    '../../utils',
    'ratyfa'
], function(
    $,
    C,
    _,
    Marionette,
    conf,
    Pad,
    Template,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'collaborative',
        viewTitle: u.i18n('Our proposal'),
        ratySettings: {
            /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
            starOff : 'fa fa-fw fa-heart-o', starOn  : 'fa fa-fw fa-heart' },
        
        events: {
            'click .member-title': function(e) {
                e.stopPropagation();
                // Show details of member
                $(e.target).toggleClass('active').siblings('.member-details').slideToggle();
            },
            'click .collab-pill': function(e) {
                e.preventDefault();
                // Set/reset css class 'active'
                $(e.target).offsetParent().addClass('active').siblings().removeClass('active');
                // Fade to target
                var target = '[data-tool='+$(e.target).attr('href')+']';
                $(target).siblings().fadeOut(250).promise().done(function() {
                    $(target).fadeIn(250);
                });
            },
            'click .member-proposal-link': function(e) {
                e.preventDefault();
                // Find members
                console.log(this.model.get('members'));
                var member = _.findWhere(this.model.get('members'), { '_id': $(e.target).attr('data-member-id') });
                // Set lightbox values
                $('.proposal-of-user').html(member.proposal_body);
                $('.name-of-user').html(member.name);
                // Show lightbox
                this.$(".lightbox").fadeIn(500);
            },
            'click .cancel': function(e) {
                if(e) e.preventDefault();
                // Hide lightbox
                this.$('.lightbox').fadeOut(500);
            }
        },
        
        initialize: function() {
            // Check which user equals the current logged in user
            _.each(this.model.get('members'), function(member) {
                if(App.session.user.get('_id') == member._id)
                    member.is_me = true;
            });
        },
        
        onBeforeRender: function() {
            this.model.set('title', this.viewTitle);
        },
        
        onRender: function() {
        },
        
        onShow: function() {
            // Set link in navigation to active
            u.setActive('nav-grp-'+this.model.get('_id'));
            
            $('[data-toggle="tooltip"]').tooltip();
            
            Pad.onShow.bind(this)();
            
            // Timer in docstate block
            var date = this.model.get('nextDeadline');
            $(".group-time-remain").countdown(date)
            .on('update.countdown', function(event) { $(this)
            .html(event.strftime(u.i18n("%D days, %H:%M:%S"))); });
            
            // Create raty objects and connect them to DOM using jquery
            _.each(this.model.get('members'), function(member) {
                member = _.extend(member, {'rating_mean': (member.rating_integration + member.rating_knowledge)/2 });
                
                $('[data-rate-type="integration"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(this.ratySettings,
                         { score: member.rating_integration, readOnly: false,
                           click: _.partial(this.saveRating, this.model, C.RATING_INTEGRATION) }));
                $('[data-rate-type="knowledge"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(this.ratySettings,
                         { score: member.rating_knowledge, readOnly: false,
                           click: _.partial(this.saveRating, this.model, C.RATING_KNOWLEDGE) }));
                $('[data-rate-type="mean"][data-rate-id="'+member._id+'"]').
                    raty(_.extend(this.ratySettings,
                         { score: member.rating_mean, readOnly: true }));
            }.bind(this));
        },
        
        updateDocumentState: function() {
            Pad.updateDocumentState.bind(this)();
        },
        
        saveRating: function(model, type, score, e) {
            // Read id from DOM and get current member
            var id = $(this).attr('data-rate-id');
            var member = _.findWhere(model.get('members'),{'_id': id});
            
            // Modify rating internal model
            switch (type) {
                case C.RATING_INTEGRATION:
                    member.rating_integration = score;
                    break;
                case C.RATING_KNOWLEDGE:
                    member.rating_knowledge = score;
                    break;
            }
            
            // Set mean rating in DOM
            $('[data-rate-type="mean"][data-rate-id="'+member._id+'"]').
               raty('set', { score: (member.rating_integration + member.rating_knowledge)/2 });
            
            // Send ratings to server
            $.post('/json/ratings/rate',
                {'id': id, 'gid': model.get('_id'), 'type': type, 'score': score},
                function(data) {});
        }
    });
    
    return View;
});