angular.module('RoomBaby')
  .factory('UserApi', function($http) {

    'use strict'

    function login(params) {
      var request = $http({
        method: 'POST',
        url: '/user/login',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function register(params) {
      var request = $http({
        method: 'POST',
        url: '/user/register',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function logout(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/logout/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function update(params) {
      var request = $http({
        method: 'POST',
        url: '/user/update',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function getOne(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/getOne/' + user_id
      })
      return (request.then(successHandler, errorHandler));
    }

    function resetPassword(params) {
      var request = $http({
        method: 'POST',
        url: '/user/reset',
        data: params
      })
      return (request.then(successHandler, errorHandler));
    }

    function isAuthenticated() {
      var request = $http({
        method: 'POST',
        url: '/user/authenticate'
      })
      return (request.then(successHandler, errorHandler));
    }

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      login: login,
      logout: logout,
      register: register,
      update: update,
      getOne: getOne,
      resetPassword: resetPassword,
      isAuthenticated: isAuthenticated
    });
    UserApi.$inject('$http');
  });
