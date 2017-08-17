// Load libraries
var angular = require("angular");

// Define app
var module = angular.module('evocracy', ['pascalprecht.translate']);

module.config(function ($translateProvider) {
  $translateProvider.translations('en', {
    TOPICS: 'Topics'
  });
  $translateProvider.translations('de', {
    TOPICS: 'Themen'
  });
  $translateProvider.preferredLanguage('en');
});

// Fade out loading spinner
$('#loading').fadeOut();

// Define topic list controller
module.controller('TopicListController', function($scope, $translate) {
    // Request topic collection via get ajax
    /*$http({
        method : 'GET', url : 'json/topics'
    }).then(function success(res) {
        this.topics = res.data;
    }.bind(this), function error(res) {
        console.error(res);
    });*/
    
    $scope.changeLanguage = function (key) {
        $translate.use(key);
    };
});

