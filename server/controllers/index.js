/**
 * Index Controller
 */

'use strict';

var config = require('../config');
var Broadcast = require('../models/broadcast');

exports.render = function(req, res, next) {
  res.sendFile(config.root + 'server/views/index.html');
};
