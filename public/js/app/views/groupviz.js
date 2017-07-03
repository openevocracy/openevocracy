define([
    'underscore',
    'jquery',
    'utils',
    'vis',
    'configs'
], function(
    _,
    $,
    u,
    vis,
    cfg) {
    
    function remap(array, keyMapping) {
        return _.map(array, function(object) {
            var result = {};
            _.each(object, function(value, key) {
                key = keyMapping[key] || key;
                result[key] = value;
            });
            
            return result;
        });
    }
    
    function groupContainsMember(group_members, group, member_id) {
        var result = _.findWhere(group_members, {
                'gid': group._id,
                'uid': member_id
            });
        
        return !_.isUndefined(result);
    }
    
    function GroupViz(groups, proposals, group_members) {
        // constructor
        {
            var $details = $('#groupviz-details');
            
            // Get ID of current logged in user and define color for me
            var me_id = App.session.user.get('_id');
            var me_color = { 'background': '#E91E63', 'border': '#E91E63', 'hover': '#F06292', 'highlight': '#AD1457'};
            
            // initial proposals are the ones that do not have a group as source
            var groupids = _.pluck(groups, '_id');
            var initial_proposals = _.reject(proposals, function(p) {return _.contains(groupids, p.source);});
            
            var participant_color = { 'background': '#9C27B0', 'border': '#9C27B0', 'hover': '#BA68C8', 'highlight': '#6A1B9A'};
            
            // initial participants are the sources of initial proposals
            var initial_participants = _.map(initial_proposals, function(p, index) {
                //var group = _.findWhere(groups, {'_id': p.sink});
                //var member = _.findWhere(group.members, {'uid': p.source});
                
                return {
                    'id': p.source,
                    'label': 'Vorschlag ' + (index+1),
                    'level': -1,
                    'color': p.source != me_id ? participant_color : me_color//,
                    //'body': member.proposal_body
                };
            });
            
            // format groups
            var num_groups = _.size(groups);
            var group_color = { 'background': '#009688', 'border': '#009688', 'hover': '#4DB6AC', 'highlight': '#00695C'};
            var groups = _.map(groups, function(g, index) {
                return {
                    'id': g._id,
                    'label': 'Gruppe' + (num_groups-index),
                    'level': g.level,
                    'color': groupContainsMember(group_members, g, me_id) ? me_color : group_color
                };
            });
            
            // define nodes
            var nodes = [].concat(initial_participants, groups);
            
            // define edges
            var proposalKeyMapping = {'source': 'from', 'sink': 'to'};
            var edges = remap(proposals, proposalKeyMapping);
            
            // create the network
            var container = document.getElementById('groupviz');
            var data = {
                'nodes': nodes,
                'edges': edges
            };
            
            var options = {
				//'height': (window.innerHeight - 175) + "px",
                'layout':{
                    'hierarchical': {
                        'enabled': true,
                        'direction': 'DU'
                    }
                },
                'interaction':{
                    'dragNodes': false,
                    'hover': true,
                    'navigationButtons': true
                },
                'nodes': {
                    //'shape': 'square',
                    'color': group_color,
                    'size': 40,
                    'borderWidth': 14,
                    'labelHighlightBold': false,
                    'font': {
                        'color': '#fff',
                        'face': 'Arial',
                        'size': 12,
                        'vadjust': 0,
                        //'strokeWidth': 7,
                        //'strokeColor': '#fff'
                    },
                    'shadow': {
                        'enabled': true,
                        'size': 4,
                        'x': 0,
                        'y': 2
                    }
                },
                'edges': {
                    'arrows': 'to',
                    'width': 2,
                    'chosen': false
                }
            };
            this.network = new vis.Network(container, data, options);
            
            // define events
            this.network.on("selectNode", function (params) {
                var id = params.nodes[0];
                var obj = _.findWhere(nodes, {'id': id});
                
                if(obj.level >= 0) {
                    $details.children('.default-details').addClass('hide');
                    $details.children('.group-details').removeClass('hide');
                    
                    var gid = id;
                    $.get('/json/group/'+gid, function(group) {
                        var finished = group.nextDeadline == -1 ? true : false;
                        
                        // Show time status of group
                        var deadlineText = finished ? 'Group has finished.' : 'Group is currently active and will finish in '+ group.nextDeadline +'.';
                        $details.children('.group-details').children('.deadline').html(deadlineText);
                        
                        // Show number of words written in that group
                        var wordsText = 'Members of that group have '+(finished ? '' : 'currently')+' written '+u.countWords(group.body)+' words.';
                        $details.children('.group-details').children('.words').html(wordsText);
                        
                        // Set link to group
                        $details.children('.group-details').children('.grouplink').attr('href', '/#/group/'+gid);
                    }.bind(this));
                } else if (obj.level == -1) {
                    $details.children('.default-details').addClass('hide');
                    $details.children('.proposal-details').removeClass('hide');
                    
                    var uid = id;
                    var proposal = _.findWhere(proposals, {'source': uid});
                    
                    $.get('/json/proposal/'+proposal._id, function(proposal) {
                        // Show number of words written in that group
                        var wordsText = 'User has written '+u.countWords(proposal.body)+' words.';
                        $details.children('.proposal-details').children('.words').html(wordsText);
                        
                        // Set link to group
                        $details.children('.proposal-details').children('.proposallink').attr('href', '/#/proposal/'+proposal._id);
                    }.bind(this));
                } else {
                    console.error('Level '+obj.level+' is unknown.');
                }
            });
            this.network.on("deselectNode", function (params) {
                $details.children('.group-details').addClass('hide');
                $details.children('.proposal-details').addClass('hide');
                $details.children('.default-details').removeClass('hide');
            });
        }
        
        var resizeCanvas = function() {
            this.network.setSize('100%', (window.innerHeight - 175) + 'px');
            this.network.fit();
        }.bind(this);
        this.resizeCanvas = resizeCanvas;

        this.destroy = function() {
        };
        
        $(window).on('resize', _.debounce(function(){
            console.log('resize');
            resizeCanvas();
        }, 500));
    }
    
    return GroupViz;
});