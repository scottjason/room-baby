/**
 * Auth Controller
 */

'use strict';

exports.isAuthenticated = function(req, res, callback) {
  if (req.originalMethod === 'GET') {
    req.session.user ? res.redirect('/') : callback();
  } else {
    if (!req.session || !req.session.user) return res.status(401).end();
    if (req.session.otSessions) {
      return res.json({
        user: req.session.user,
        sessions: req.session.otSessions
      })
    }
    res.json({
      user: req.session.user
    });
  }
};
