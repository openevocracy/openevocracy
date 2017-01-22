define([
    'jquery',
    'underscore',
    'Marionette',
    //'Embed',
    'strftime',
    'constants',
    'configs',
    'views/pad',
    'views/chat',
    'hbs!templates/groups/collaborative',
    '../../utils',
    'ratyfa'
], function(
    $,
    _,
    Marionette,
    //Embed,
    dateformat,
    C,
    conf,
    Pad,
    Chat,
    Template,
    u
    ) {
    
    var View = Marionette.ItemView.extend({
        template: Template,
        tagName: 'section',
        className: 'content',
        id: 'collaborative',
        loaded: false,
        
        ratySettings: {
            /*half: true, FIXME: https://github.com/FortAwesome/Font-Awesome/issues/2301 */
            starOff : 'fa fa-fw fa-heart-o', starOn  : 'fa fa-fw fa-heart' },
            
        modelEvents: {
            'change:body': 'render'
        },
        
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
                var member = _.findWhere(this.model.get('members'), { '_id': $(e.target).attr('data-member-id') });
                // Set lightbox values
                $('.proposal-of-user').html(member.proposal_body);
                $('.name-of-user').html(member.name);
                // Show lightbox
                this.$(".lightbox").fadeIn(500);
            },
            'keydown #chat-message': function(e) {
                if(e.keyCode == 13) {
                    this.sendMessage();
                    if(e) e.preventDefault();
                }
            },
            'click #chat-send': function(e) {
                e.preventDefault();
                this.sendMessage();
            },
            'click .cancel': function(e) {
                if(e) e.preventDefault();
                // Hide lightbox
                this.$('.lightbox').fadeOut(500);
            }
        },
        
        initialize: function() {
            // Create timer for automatic refreshing of topic details
            if(!this.model.has('body'))
                this.timer = setInterval(function() {
                    // Level/Stage change depends on cronjob
                    this.model.fetch();
                }.bind(this), 60000);
        },
        
        onDestroy: function() {
            clearInterval(this.timer);
            Chat.remove.bind(this)();
        },

        onRender: function() {
            if(this.loaded)
                this.onDOMexists();
            
            if(this.model.has('body'))
                clearInterval(this.timer);
        },
        
        onShow: function() {
            this.onDOMexists();
            this.loaded = true;
            
            // Set link in navigation to active
            u.setActive('nav-grp-'+this.model.get('_id'));
            
            // Activate tooltip
            $('[data-toggle="tooltip"]').tooltip();
            
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
            
            // Set height of editor to have the size of the navigation
            $('#editor').css('min-height', $('.navigation-content').height() - $('.ql-toolbar').outerHeight());
            $('#chat-messages').css('max-height', $('#editor').height());
        },
        
        onDOMexists: function() {
            if(!this.model.has('body')) {
                var messageCallback = this.onReceiveMessage.bind(this);
                var onlineCallback  = this.onNotifyOnline.bind(this);
                var uid   = App.session.user.get('_id');
                var uname = _.findWhere(this.model.get('members'), { '_id': uid }).name;
                
                Pad.onShow.bind(this)();
                Chat.onShow.bind(this)(messageCallback, onlineCallback, uid, uname);
            }
            
            // Timer in docstate block
            var date = this.model.get('nextDeadline');
            $(".group-time-remain").countdown(date)
                .on('update.countdown', function(event) { $(this)
                .html(event.strftime(u.i18n("%D days, %H:%M:%S"))); });
        },
        
        sendMessage: function() {
            var text = $('#chat-message').val();
            if(text.trim() == "")
                return;
            
            // send message
            Chat.sendText.bind(this)(text);
            // clear input field
            $('#chat-message').val('');
        },
        
        onReceiveMessage: function(msg) {
            var me_id = App.session.user.get('_id');
            
            var el = '';
            if(!_.isUndefined(msg.text)) {
                var user = _.findWhere(this.model.get('members'), {'_id': msg.uid});
                var me_class = (msg.uid == me_id) ? ' msg-me' : '';
                var el_head = '<span class="msg-date">'+ dateformat('%d.%m., %H:%M:%S', new Date(u.getTimestamp(msg._id))) +'</span><span class="msg-sender"><strong class="user-name"><span class="user-color" style="background-color: '+ user.color +';"></span>'+ user.name + '</strong></span>';
                var el_body = '<span id="'+ msg._id +'" class="msg-text">' + msg.text + '</span>';
                el = '<div class="msg-wrap'+ me_class +'">'+ el_head + el_body +'</div>';
            } else if(!_.isUndefined(msg.info))
                el = '<div class="msg-info"><span>'+ u.strformat(u.i18n(msg.info), msg.arg) +'</span></div>';
            
            // append element to DOM
            $('#chat-messages').prepend(el);
            
            // Emoji magic
            /*if(!_.isUndefined(msg.text)) {
                // EmbedJS magic
                var embed = new Embed({
                    input : document.getElementById(msg._id),
                    link: true,
                    emoji: true,
                    fontIcons: false
                });
                embed.render();
                //?embed.destroy();
            }*/
        },
        
        onNotifyOnline: function(users) {
            var me_id = App.session.user.get('_id');
            
            // make array unique and remove own user
            var other_users = _.without(_.uniq(users), me_id);
            
            // if there is any user except own, add to model
            if(!_.isEmpty(other_users)) {
                var members = this.model.get('members');
                // filter members
                var online_members = _.filter(members, function(member) {
                    return _.contains(other_users, member._id);
                });
                // save online members to model
                this.model.set('online', online_members);
            }
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