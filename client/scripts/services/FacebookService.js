angular.module('RoomBaby')
  .factory('FacebookService', function() {

    'use strict'

    function generateUrl(partnerId, archiveId) {
      return 'https://room-baby-video-api.herokuapp.com/embed/' + partnerId + '/' + archiveId;
    }

    function openShareDialog(href) {
      console.log(href);
      FB.ui({
        method: 'share',
        href: href
      }, function(response) {
        console.log('response from facebook', response);
      });
      // FB.ui({
      //   method: 'feed',
      //   name: 'Room Baby Videos',
      //   link: 'http://www.facebook.com',
      //   picture: 'http://img.youtube.com/vi/1CE6W5BubQo/0.jpg',
      //   caption: 'My caption',
      //   description: 'My description',
      //   source: 'https://s3-us-west-2.amazonaws.com/rtc-videos/45238782/e42810ef-7639-4fcd-aeb5-25c8833667c4/archive.mp4'
      // }, function(response) {
      //   console.log('response from facebook', response);
      // });
    }

    return ({
      generateUrl: generateUrl,
      openShareDialog: openShareDialog
    });
  });
