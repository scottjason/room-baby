angular.module('RoomBaby')
  .factory('Transport', function() {

    'use strict'

    function generateHtml(obj, callback) {
      var type = obj.type;
      switch (type) {
        case 'onConnected':
          onConnected(obj.connectedWith, obj.sessionStartedAt, callback);
          break;
        case 'chatMessage':
          chatMessage(obj.sentBy, obj.message, obj.profileImage, obj.timeSent, callback);
          break;
        case 'shareFile':
          shareFile(obj.sentBy, obj.fileUrl, obj.timeSent, callback);
          break;
        case 'sendReceipt':
          sendReceipt(obj.receiptType, obj.isGranted || null, callback);
          break;
        case 'requestPermission':
          requestPermission(obj.requestedBy, callback);
          break;
        default:
          console.error('No case found for ', type);
      }
    };

    function onConnected(connectedWith, sessionStartedAt, callback) {
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
      callback(html);
    };

    function chatMessage(userName, userMessage, profileImage, timeSent, callback) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<a class="pull-left" href="">' +
        '<img class="media-object img-circle" src=' + profileImage + ' alt="">' +
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
      callback(html);
    };

    function shareFile(sentBy, fileUrl, timeSent, callback) {
      var downloadLink = "<a class='download-link' href=" + fileUrl + " target='_blank'>Click to Download</a>";
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
      callback(html);
    };

    function sendReceipt(receiptType, isGranted, callback) {
      if (receiptType === 'shareFile') {
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
      } else if (receiptType === 'permissionResponse' && isGranted) {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Request To Record Granted</span>' +
          '</h4>' +
          '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp; Recording Started At' + '</p>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      } else if (receiptType === 'permissionResponse' && !isGranted) {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Request To Record Was Not Granted</span>' +
          '</h4>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      }
      callback(html);
    };

    function requestPermission(requestedBy, callback) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Room Baby Notice</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + requestedBy.capitalize() + ' Would Like To Record This Session' + '</p>' +
        '<p class="recording-permission">Is this ok?' +
        '</p>' +
        '<ul class="permision-copy-container">' +
        '<li id="permission-granted">OK!' +
        '</li>' +
        '<li id="permission-denied" class="permission-no">&nbsp;&nbsp; No Thanks!' +
        '</li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    };

    return ({
      generateHtml: generateHtml
    });
  });
