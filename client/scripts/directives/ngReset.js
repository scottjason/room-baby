angular.module('RoomBaby')
  .directive('ngReset', function(pubSub) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {
      	console.log('ngReset', event);
        console.log(event.target.id);
      });
    };
  ngReset.$inject('pubSub');
});