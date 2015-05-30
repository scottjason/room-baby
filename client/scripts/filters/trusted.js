angular.module('RoomBaby')
  .filter('trusted', ['$sce', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}]);

