'use strict';

var sessionCtrl = require('./session')

exports.bindSocket = function(io) {
  io.on('connection', function(socket) {
    socket.emit('connected');
    exports.registerEvents(socket);
  });
};

exports.registerEvents = function(socket) {
  socket.on('userConnected', sessionCtrl.onUserConnected);
  socket.on('userDisconnected', sessionCtrl.onUserDisconnected);
  socket.on('getVideoStatus', sessionCtrl.getVideoStatus);
  socket.on('getActiveUsers', sessionCtrl.getActiveUsers);
};
