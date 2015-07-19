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

    function saveUserName(params) {
      var request = $http({
        method: 'POST',
        url: '/user/save-user-name',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function upload(params) {
      var request = $http({
        method: 'POST',
        url: 'user/upload-profile-img',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function upload(file, user_id) {
      var formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user_id);
      var request = $http({
        method: 'POST',
        url: '/user/upload',
        data: formData,
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
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

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/get-all/' + user_id
      })
      return (request.then(successHandler, errorHandler));
    }

    function getOne(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/get-one/' + user_id
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

    function postToFacebook(params) {
      console.log('posting to facebook');
      var request = $http({
        method: 'POST',
        url: '/user/facebook-post',
        data: params
      })
      return (request.then(successHandler, errorHandler));
    }

    function generateOpts(user) {
      var userId = user._id;
      var opts = {
        user_id: userId
      };
      return opts;
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
      getAll: getAll,
      upload: upload,
      saveUserName: saveUserName,
      resetPassword: resetPassword,
      isAuthenticated: isAuthenticated,
      postToFacebook: postToFacebook,
      generateOpts: generateOpts
    });
    UserApi.$inject('$http');
  });
