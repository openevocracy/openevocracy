define([
    'underscore',
    'jquery',
    'backbone',
    'models/user',
    'jquerycookie'
], function(_, $, Backbone, User){

    var SessionModel = Backbone.Model.extend({
        
        isLoggedIn: function(){
            if(this.get('logged_in'))
                return true;
            else {
                if($.cookie('auth_token')) {
                    this.checkAuth({});
                    return true;
                } else
                    return false;
            }
        },

        initialize: function(){
            _.bindAll.apply(_, [this].concat(_.functions(this)));

            // Singleton user object
            // Access or listen on this throughout any module with App.session.user
            this.user = new User({ });
        },


        url: function(){
            return '/json/auth';
        },

        // Fxn to update user attributes after recieving API response
        updateSessionUser: function( userData ){
            this.user.set( userData );
            
            if(userData.lang != localStorage.getItem('locale')) {
                localStorage.setItem('locale', userData.lang);
                location.reload();
            }
        },

        /*
         * Check for session from API 
         * The API will parse client cookies using its secret token
         * and return a user object if authenticated
         */
        checkAuth: function(callback, args) {
            // Check if there are tokens in localstorage
            this.fetch({
                success: function(mod, res){
                    if(!res.error && res.user){
                        this.updateSessionUser( res.user );
                        this.set({ logged_in : true });
                        if('success' in callback) callback.success(mod, res);    
                    } else {
                        this.set({ logged_in : false });
                        if('error' in callback) callback.error(mod, res);    
                    }
                }.bind(this),
                error:function(mod, res){
                    this.set({ logged_in : false });
                    if('error' in callback) callback.error(mod, res);    
                }.bind(this)
            }).complete( function(){
                if('complete' in callback) callback.complete();
            });
        },


        /*
         * Abstracted fxn to make a POST request to the auth endpoint
         * This takes care of the CSRF header for security, as well as
         * updating the user and session after receiving an API response
         */
        postAuth: function(opts, callback, args){
            $.ajax({
                url: this.url() + '/' + opts.method,
                contentType: 'application/json',
                dataType: 'json',
                type: 'POST',
                beforeSend: function(xhr) {
                    // Set the CSRF Token in the header for security
                    var token = $('meta[name="csrf-token"]').attr('content');
                    if (token) xhr.setRequestHeader('X-CSRF-Token', token);
                },
                data:  JSON.stringify( _.omit(opts, 'method') ),
                success: function(res){
                    if(_.indexOf(['login', 'signup'], opts.method) !== -1){
                        this.updateSessionUser( res.user || {} );
                        this.set({ logged_in: true });
                    } else
                        this.set({ logged_in: false });
                    
                    if( callback && 'success' in callback ) callback.success(res);
                }.bind(this),
                error: function(xhr, err){
                    if(callback && 'error' in callback ) callback.error(xhr, err);
                }.bind(this)
            }).complete( function(xhr){
                if(callback && 'complete' in callback ) callback.complete(xhr);
            });
        },
        
        login: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'login' }), callback);
        },
        
        logout: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'logout' }), callback);
        },
        
        signup: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'signup' }), callback);
        },
        
        removeAccount: function(opts, callback, args){
            this.postAuth(_.extend(opts, { method: 'remove_account' }), callback);
        },

    });
    
    return SessionModel;
});