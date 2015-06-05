'use strict';

var sessionCtrl = require('./session')

exports.onSocket = function(io) {
  io.on('connection', function(socket) {
    socket.emit('connected');
    exports.socket = socket;
    exports.registerEvents(socket);
  })
};

exports.registerEvents = function(socket) {
  socket.on('getVideoStatus', sessionCtrl.getVideoStatus);
};
