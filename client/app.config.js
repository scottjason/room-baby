'use strict';

angular.module('RoomBaby')
  .config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider) {

    String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    };

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
      .state('work', {
        url: '/how-this-works',
        templateUrl: 'views/work.html',
        controller: 'WorkCtrl as workCtrl'
      })

    localStorageServiceProvider
      .setPrefix('RoomBaby')
      .setNotify(true, true)

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });
