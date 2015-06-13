angular.module('RoomBaby')
  .service('dialog', function() {

    'use strict'

  function generate(type) {
    if (type === 'createRoom') {
      console.log('');
    }
  }

  return ({
    generate: generate
  });
});