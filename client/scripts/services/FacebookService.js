angular.module('RoomBaby')
  .factory('FacebookService', function(localStorageService) {

    'use strict'

    function generateHref(isBroadcast) {
      if (!isBroadcast) {
        var partnerId = localStorageService.get('archive').partnerId;
        var archiveId = localStorageService.get('archive').id;
        return 'https://roombaby-api.herokuapp.com/embed/' + partnerId + '/' + archiveId;
      } else {
        return localStorageService.get('broadcast').longUrl;
      }
    }

    function openShareDialog(href, isBroadcast) {
      if (!isBroadcast) {
        FB.ui({
          method: 'share',
          href: href
        }, function(response) {
          return;
        });
      } else {
        console.log(href);

        FB.ui({
          method: 'feed',
          link: href,
          picture: 'https://raw.githubusercontent.com/scottjason/room-baby-api/master/views/img/rb-embed-735-350.png',
          name: "Room Baby Broadcast",
          description: "The description who will be displayed"
        }, function(response) {
          console.log(response);
        });
      }
    }

    return ({
      generateHref: generateHref,
      openShareDialog: openShareDialog
    });
    FacebookService.$inject('localStorageService');
  });
