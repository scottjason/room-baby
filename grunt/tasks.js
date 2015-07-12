'use strict';

exports.get = function(type) {
  if (type === 'server') {
    return ['clean:all', 'concurrent:concat', 'concurrent:minify', 'copy:bower_fonts', 'concurrent:watch'];
  }
  if (type === 'deploy') {
    return ['clean:all', 'concurrent:concat', 'concurrent:minify', 'copy:bower_fonts'];
  }
};
