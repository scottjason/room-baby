angular.module('RoomBaby')
  .factory('Transport', function() {

    'use strict'

    function render(userName, userMessage, userImage, timeSent) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<a class="pull-left" href="">' +
        '<img class="media-object img-circle" src=' + userImage + ' alt="">' +
        '</a>' +
        '<div class="media-body">' +
        '<h4 class="media-heading sent-by">' +
        userName + ' @ ' +
        '<span>' + timeSent + '</span>' +
        '</h4>' +
        '<p class="chat-text">' + userMessage + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';

      $(".chatbox").append(html);
    };

    function connected(connectedWith, sessionStartedAt) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Session Started ' + sessionStartedAt + '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + connectedWith + ' is now connected </p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';

      $(".chatbox").append(html);
    };

    function sendFile(sentBy, fileUrl, timeSent) {
      var userImage = 'https://www.libstash.com/public/avatars/default.png'
      var downloadLink = "<a class='download-link' href=" + fileUrl + " target='_blank'>click to download</a>";
      var message = sentBy + ' has shared a file. ';
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<a class="pull-left" href="">' +
        '<img class="media-object img-circle" src=' + userImage + ' alt="">' +
        '</a>' +
        '<div class="media-body">' +
        '<h4 class="media-heading sent-by">' +
        sentBy + ' @ ' +
        '<span>' + timeSent + '</span>' +
        '</h4>' +
        '<p class="file-text">' + message + '</p>' +
        downloadLink +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';

      $(".chatbox").append(html);
    }
    return ({
      render: render,
      connected: connected,
      sendFile: sendFile
    });
  });
