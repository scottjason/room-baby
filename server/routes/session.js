/**
 * Session Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var sessionCtrl = require('../controllers/session');

module.exports = function(app) {
  router.get('/:user_id', sessionCtrl.getAll);
  router.get('/record/:session_id', sessionCtrl.startRecording);
  router.get('/stop/:archive_id', sessionCtrl.stopRecording);
  router.get('/get/:archive_id', sessionCtrl.getRecording);
  router.get('/delete-recording/:archive_id', sessionCtrl.deleteRecording);
  router.get('/create-broadcast/:user_id', sessionCtrl.createBroadcast);
  router.get('/get-broadcast/:broadcast_id', sessionCtrl.getBroadcast);
  router.get('/video-status/:archive_id', sessionCtrl.getVideoStatus);
  router.post('/embed', sessionCtrl.generateVideoEmbed);
  router.post('/create-room', sessionCtrl.createRoom);
  router.post('/upload', sessionCtrl.upload);
  router.delete('/:session_id/:user_id', sessionCtrl.deleteSession);
  app.use('/session', router);
}