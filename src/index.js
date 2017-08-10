// Load libraries
var angular = require("angular");

// Define app
var module = angular.module('evocracy', []);

// Fade out loading spinner
$('#loading').fadeOut();

// Define topic list controller
module.controller('TopicListController', function($http) {
    // Request topic collection via get ajax
    $http({
        method : 'GET', url : 'json/topics'
    }).then(function success(res) {
        this.topics = res.data;
    }.bind(this), function error(res) {
        console.error(res);
    });
});

