/**
 * Archive Router
 */

'use strict';

var express = require('express');
var router = express.Router();
var archiveCtrl = require('../controllers/archive');

module.exports = function(app) {
  router.post('/', archiveCtrl.createArchive);
  router.get('/:user_id', archiveCtrl.getAll);
  app.use('/archive', router);
};
