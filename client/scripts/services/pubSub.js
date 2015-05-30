angular.module('RoomBaby')
  .factory('PubSub', function() {

  'use strict'

  var master = {};

  function on(topic, callback) {
    if (!master.hasOwnProperty(topic)) {
      master[topic] = [];
      return master[topic].push(callback);
    } else {
      return false;
    }
  };

  function off(topic, callback) {
    if (!master.hasOwnProperty(topic)) {
      return console.error("Topic Was Never Subscribed To :", topic);
    }
    for (var i = 0, len = master[topic].length; i < len; i++) {
      if (master[topic][i] === callback) {
        return master[topic].splice(i, 1);
      }
    }
  };

  function trigger() {
    var args = Array.prototype.slice.call(arguments);
    var topic = args.shift();
    if (!master.hasOwnProperty(topic)) {
      return console.error("Trigger Has No Corressponding Subscriber For Topic :", topic);
    }
    for (var i = 0, len = master[topic].length; i < len; i++) {
      master[topic][i].apply(undefined, args);
    }
  };

  return ({
    on: on,
    off: off,
    trigger: trigger
  });
});
