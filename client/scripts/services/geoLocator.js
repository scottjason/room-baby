angular.module('RoomBaby')
  .factory('GeoLocator', function() {

    'use strict'

    var master = {};

    function get(callback) {
      master.callback = callback
      if (navigator.geolocation && typeof(navigator.geolocation.getCurrentPosition) == "function") {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
          maximumAge: 75000
        });
      }
    };

    function reverseGeo(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          for (var i = 0; i < results.length; i++) {
            if (results[i].types[0] === "locality") {
              var city = results[i].address_components[0].long_name;
              var state = results[i].address_components[2].short_name;
              var location = (city + ", " + state).toString();
              master.callback(location);
            }
          }
        }
      }
    };

    function onGeoSuccess(position) {
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var coder = new google.maps.Geocoder();
      coder.geocode({
        'latLng': latLng
      }, reverseGeo);
    };

    function onGeoError(err) {
      return master.callback(err);
    };

    return ({
      get: get
    });
  });
