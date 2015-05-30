'use strict';

var grunt = require('grunt');

module.exports = {
  options: {
    dateFormat: function(time) {
      grunt.log.writeln('\n The watch finished in ' + time + 'ms at' + (new Date()).toString());
      grunt.log.writeln('\n Waiting for more changes...');
    },
  },
  styles: {
    files: ['client/styles/*.css', '!client/styles/lib/**/*.css'],
    tasks: ['concat:dev_styles', 'cssmin'],
    options: {
      spawn: false,
    }
  },
  scripts: {
    files: [
    'client/app.js', 
    'client/app.config.js', 
    'client/scripts/controllers/dashboard.js', 
    'client/scripts/controllers/landing.js', 
    'client/scripts/controllers/navbar.js', 
    'client/scripts/controllers/session.js', 
    'client/scripts/services/*.js', 
    'client/scripts/directives/*.js', 
    '!client/scripts/lib/**/*.js'
    ],
    tasks: ['concat:dev_scripts', 'uglify:dev_scripts'],
    options: {
      spawn: false,
    }
  }
};