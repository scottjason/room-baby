angular.module('RoomBaby')
  .factory('pubSub', function() {

    'use strict'

    var master = {};

    function on(topic, callback) {
      if (!master.hasOwnProperty(topic)) {
        master[topic] = [];
        master[topic].push(callback);
      }
    };

    function off(topic, callback) {
      if (!master.hasOwnProperty(topic)) {
        console.error('Topic Was Never Subscribed To :', topic);
      } else {
        for (var i = 0, len = master[topic].length; i < len; i++) {
          if (master[topic][i] === callback) {
            master[topic].splice(i, 1);
          }
        }
      }
    }

    function trigger() {
      var args = Array.prototype.slice.call(arguments);
      var topic = args.shift();
      if (!master.hasOwnProperty(topic)) {
        console.error('Trigger Has No Corressponding Subscriber For Topic :', topic);
      } else {
        for (var i = 0, len = master[topic].length; i < len; i++) {
          master[topic][i].apply(undefined, args);
        }
      }
    }

    return ({
      on: on,
      off: off,
      trigger: trigger
    });
  });
