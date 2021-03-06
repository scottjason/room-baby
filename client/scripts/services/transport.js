angular.module('RoomBaby')
  .factory('Transport', function(localStorageService) {

    'use strict'

    var now = moment(new Date()).calendar();

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
        case 'shareVideo':
          shareVideo(obj.videoUrl, callback);
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
    }

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
    }

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
    }

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
    }

    function shareVideo(videoUrl, callback) {
      var downloadLink = "<a class='download-link' href=" + videoUrl + " target='_blank'>Click to Download</a>";
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started">Video Ready. Click to Download.' +
        '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + downloadLink + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

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
          '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp; Recording Started' + '</p>' +
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
    }

    function requestPermission(obj, callback) {
      console.log('obj', obj)
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Room Baby Notice</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;Would Like To Record This Session' + '</p>' +
        '<p class="recording-permission">Is this ok?' +
        '</p>' +
        '<ul class="permision-copy-container">' +
        '<li class="permission-granted" id="{{ obj.permissionGranted + "-isGranted" }}">Yes!' +
        '</li>' +
        '<li class="permission-denied" id="{{ obj.permissionDenined + "-isDenied" }}">&nbsp;&nbsp; No Thanks!' +
        '</li>' +
        '<li id="confirm">OK!' +
        '</li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function generateMessage(user, callback) {
      var obj = {};
      obj.sentBy = user.username;
      obj.message = user.message;
      obj.profileImage = user.profileImage;
      var timeSent = angular.copy(now);
      timeSent = timeSent.split(' ');
      timeSent.splice(0, 2);
      timeSent = timeSent.join(' ');
      obj.timeSent = timeSent;
      var chatMessage = JSON.stringify(obj);
      callback(chatMessage);
    }

    function generateOpts(type, data) {
      var opts = {};
      opts.type = type;
      if (type === 'onConnected') {
        opts.connectedWith = data;
        opts.sessionStartedAt = angular.copy(now);
        localStorageService.set('connectedWith', opts.connectedWith);
        localStorageService.set('sessionStartedAt', opts.sessionStartedAt);
      } else if (type === 'chatMessage') {
        var data = JSON.parse(data);
        opts.sentBy = data.sentBy;
        opts.message = data.message;
        opts.profileImage = data.profileImage;
        opts.timeSent = data.timeSent;
      } else if (type === 'sendReceipt') {
        opts.receiptType = 'permissionResponse';
        opts.isGranted = data.indexOf('granted') !== -1;
      } else if (type === 'requestPermission') {
        opts.requestedBy = data;
      } else if (type === 'shareVideo') {
        opts.videoUrl = data;
      }
      return opts;
    }

    function scroll(direction) {
      if (direction === 'down') {
        var container = document.getElementById('transport-container');
        container.scrollTop = container.scrollHeight;
      }
    }

    return ({
      generateHtml: generateHtml,
      generateMessage: generateMessage,
      generateOpts: generateOpts,
      scroll: scroll
    });
    Transport.$inject('localStorageService');
  });
