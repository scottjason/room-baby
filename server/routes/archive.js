/**
 * Archive Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var archiveCtrl = require('../controllers/archive');

module.exports = function(app) {
  router.post('/', archiveCtrl.createArchive);
  app.use('/archive', router);
};
