'use strict';


angular
  .module('RoomBaby', [
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'ngSanitize',
    'ngDialog',
    'LocalStorageModule'
  ])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider) {

  $stateProvider
    .state('landing', {
      url: '/',
      templateUrl: 'views/landing.html',
      controller: 'LandingCtrl as landingCtrl'
    })
    .state('dashboard', {
      url: '/dashboard/:user_id',
      templateUrl: 'views/dashboard.html',
      controller: 'DashCtrl as dashCtrl'
    })
    .state('session', {
      url: '/dashboard/:user_id/',
      templateUrl: 'views/session.html',
      controller: 'SessionCtrl as sessionCtrl'
    })

  localStorageServiceProvider
    .setPrefix('RoomBaby')
    .setNotify(true, true)

  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(true);
  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
