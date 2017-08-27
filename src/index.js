// Load libraries
var angular = require("angular");
var bootstrap = require("bootstrap"); // TODO load it in webpack.config.js -> plugins
var angularTranslate = require("angular-translate");
var angularTranslateFiles = require("angular-translate-loader-partial");
var angularRoute = require("angular-route");
var version = require('../package.json').version

// Define app
var module = angular.module('evocracy', [angularTranslate, angularRoute]);

module.config(function($translateProvider, $translatePartialLoaderProvider) {
	// Register a loader for the static files
	$translatePartialLoaderProvider.addPart('ids');
	$translatePartialLoaderProvider.addPart('classes');
	$translateProvider.useLoader('$translatePartialLoader', {
		urlTemplate: 'i18n/{lang}/{part}.json'
	});
	
	$translateProvider.useSanitizeValueStrategy('escape'); // see https://angular-translate.github.io/docs/#/guide/19_security
	$translateProvider.preferredLanguage('de');
});

module.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/', {
			name: 'topics',
			templateUrl: "topics.html",
			controller: "TopicListController"
		})
		.when('/topics', {
			name: 'topics',
			templateUrl: "topics.html",
			controller: "TopicListController"
		})
		.when('/timeline', {
			name: 'timeline',
			templateUrl: "timeline.html",
			controller: "TimelineController"
		});
}]);

// Define header controller
module.controller('HeaderController', function($scope, $translate) {
	$scope.setLanguage = function(lang) {
		$translate.use(lang);
	};
});

// Define header controller
module.controller('FooterController', function($scope) {
	$scope.version = version;
});

// Define topic list controller
module.controller('TopicListController', function($scope, $http) {
	// Request topic collection via get ajax
	$http({
		method : 'GET', url : 'json/topics'
	}).then(function success(res) {
		this.topics = res.data;
	}.bind(this), function error(res) {
		console.error(res);
	});
});

// Define timeline controller
module.controller('TimelineController', function($scope, $translate) {
	$scope.setLanguage = function(lang) {
		$translate.use(lang);
	};
});



// Fade out loading spinner
$('#loading').fadeOut(function() {
	$('#layout').fadeIn();
});
