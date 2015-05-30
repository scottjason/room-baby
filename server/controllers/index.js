/**
 * Index Controller
 */

'use strict';

var config = require('../config');

exports.render = function(req, res, next) {
  res.sendFile(config.root + 'server/views/index.html');
};

