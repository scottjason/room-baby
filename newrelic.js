/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
var config = require('./server/config');

exports.config = {
  app_name: ['Room Baby'],
  license_key: config.newRelic.key,
  logging: {
    level: 'info'
  }
}
