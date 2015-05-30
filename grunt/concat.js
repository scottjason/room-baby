'use strict';

module.exports = {
  options: {
    separator: '\n\n',
  },
  src: [ 'client/app.js',
    'client/app.config.js',
    'client/scripts/controllers/dashboard.js',
    'client/scripts/controllers/landing.js',
    'client/scripts/controllers/navbar.js',
    'client/scripts/controllers/footer.js',
    'client/scripts/controllers/session.js',
    'client/scripts/services/*.js',
    'client/scripts/directives/*.js',
    'client/scripts/filters/*.js',
    '!client/scripts/lib/**/*.js'
  ],
  dev_scripts: {
    src: ['client/app.js',
      'client/app.config.js',
      'client/scripts/controllers/dashboard.js',
      'client/scripts/controllers/landing.js',
      'client/scripts/controllers/navbar.js',
      'client/scripts/controllers/footer.js',
      'client/scripts/controllers/session.js',
      'client/scripts/services/*.js',
      'client/scripts/directives/*.js',
      'client/scripts/filters/*.js',
      '!client/scripts/lib/*.js'
    ],
    dest: 'client/build/dev.js'
  },
  vendor_scripts: {
    src: ['client/bower_components/jquery/dist/jquery.js',
      'client/bower_components/bootstrap/dist/js/bootstrap.js',
      'client/bower_components/angular/angular.js',
      'client/bower_components/velocity/velocity.js',
      'client/bower_components/velocity/velocity.ui.js',
      'client/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
      'client/bower_components/angular-local-storage/dist/angular-local-storage.js',
      'client/bower_components/angular-route/angular-route.js',
      'client/bower_components/angular-ui-router/release/angular-ui-router.js',
      'client/bower_components/angular-sanitize/angular-sanitize.js',
      'client/bower_components/angular-smart-table/dist/smart-table.js',
      'client/bower_components/angular-mocks/angular-mocks.js',
      'client/bower_components/ngDialog/js/ngDialog.js',
      'client/bower_components/moment/moment.js',
      'client/bower_components/html5shiv/dist/html5shiv.js'
    ],
    dest: 'client/build/vendor.js'
  },
  dev_styles: {
    src: ['client/styles/*.css'],
    dest: 'client/build/dev.css'
  },
  vendor_styles: {
    src: ['client/bower_components/bootstrap/dist/css/bootstrap.css', 'client/bower_components/ngDialog/css/ngDialog.css', 'client/styles/lib/tooltip.css'],
    dest: 'client/build/vendor.css'
  },
};
