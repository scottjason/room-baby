'use strict';

module.exports = {
  bower_fonts: {
    cwd: 'client/bower_components/bootstrap/dist/fonts',
    src: ['glyphicons-halflings-regular.eot',
      'glyphicons-halflings-regular.svg',
      'glyphicons-halflings-regular.ttf',
      'glyphicons-halflings-regular.woff',
      'glyphicons-halflings-regular.woff2'
    ],
    dest: 'client/assets/fonts',
    expand: true
  },
  assets: {
    cwd: ['client/assets'],
    src: '**/*',
    dest: 'dist/assets',
    expand: true
  },
  vendor_scripts: {
    cwd: 'client/scripts/vendor',
    src: '**/*',
    dest: 'client/scripts/vendor',
    expand: true
  },
  vendor_styles: {
    cwd: 'client/styles/lib',
    src: '**/*',
    dest: 'dist/styles/lib',
    expand: true
  },
  build: {
    cwd: 'client/build/',
    src: ['*.min.js', '*.min.css'],
    dest: 'dist/build',
    expand: true
  },
  indexHtml: {
    src: 'client/index.html',
    dest: 'dist/index.html',
  },
  views: {
    cwd: 'client/views',
    src: '**/*',
    dest: 'dist/views',
    expand: true
  }
};
