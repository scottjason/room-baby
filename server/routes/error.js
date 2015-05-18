/**
 * Error Handler
 */

'use strict';

module.exports = function(app) {
  app.use(function(req, res, next) {
    return res.status(404).render('404');
  });

  app.use(function(err, req, res, next) {
    res.format({
      html: function() {
        return res.status(500).render('500', { status: 500, name: err.name, message: err.message });
      },
      json: function() {
        return res.status(err.status || 500).json({ name: err.name, message: err.message })
      }
    });
  });
};