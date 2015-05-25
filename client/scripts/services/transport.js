angular.module('RoomBaby')
  .factory('Transport', function() {

    'use strict'

    var chatbox = angular.element(document.getElementById('chatbox'));

    function connected(connectedWith, sessionStartedAt) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Session Started ' + sessionStartedAt + '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + connectedWith.capitalize() + ' Is Now Connected </p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';

      chatbox.append(html);
    };

    function render(userName, userMessage, userImage, timeSent) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<a class="pull-left" href="">' +
        '<img class="media-object img-circle" src=' + userImage + ' alt="">' +
        '</a>' +
        '<div class="media-body">' +
        '<h4 class="media-heading sent-by">' +
        userName.capitalize() + ' @ ' +
        '<span>' + timeSent + '</span>' +
        '</h4>' +
        '<p class="chat-text">' + userMessage + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';

      chatbox.append(html);
    };

    function sendFile(sentBy, fileUrl, timeSent) {
      var downloadLink = "<a class='download-link' href=" + fileUrl + " target='_blank'>click to download</a>";
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started">' + sentBy.capitalize() + ' Has Shared A File' +
        '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + downloadLink + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      chatbox.append(html);
    };

    function sendReceipt(type) {
      if (type === 'file-shared') {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Room Baby Confirmation</span>' +
          '</h4>' +
          '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp; Your File Has Been Successfully Shared' + '</p>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      }

      chatbox.append(html);
    };

    return ({
      render: render,
      connected: connected,
      sendFile: sendFile,
      sendReceipt: sendReceipt
    });
  });
