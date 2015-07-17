/**
 * Auth Controller
 */

'use strict';

exports.isAuthenticated = function(req, res, callback) {
  if (req.originalMethod === 'GET') {
    req.session.user ? res.redirect('/') : callback();
  } else if (!req.session.user) {
    res.status(401).end();
  } else {
    res.json({
      user: req.session.user,
      sessions: req.session.otSessions || [],
      archives: req.session.archives || []
    });
  }
};
