'use strict';

module.exports = {
  clean: ['clean:all'],
  concat: ['concat:dev_scripts', 'concat:vendor_scripts', 'concat:dev_styles', 'concat:vendor_styles'],
  copy: ['copy:assets', 'copy:vendor_scripts', 'copy:build', 'copy:indexHtml', 'copy:views'],
  minify: ['uglify:dev_scripts', 'uglify:vendor_scripts', 'cssmin:dev_styles', 'cssmin:vendor_styles'],
  watch: ['watch:scripts', 'watch:styles', 'nodemon'],
  options: {
    logConcurrentOutput: true
  }
};
