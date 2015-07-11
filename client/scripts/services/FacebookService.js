angular.module('RoomBaby')
  .factory('FacebookService', function(localStorageService) {

    'use strict'

    function generateHref() {
      var partnerId = localStorageService.get('archive').partnerId;
      var archiveId = localStorageService.get('archive').id;
      return 'https://room-baby-video-api.herokuapp.com/embed/' + partnerId + '/' + archiveId;
    }

    function openShareDialog(href) {
      FB.ui({
        method: 'share',
        href: href
      }, function(response) {
        return;
      });
    }

    return ({
      generateHref: generateHref,
      openShareDialog: openShareDialog
    });
    FacebookService.$inject('localStorageService');
  });
