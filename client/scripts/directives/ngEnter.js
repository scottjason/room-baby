angular.module('RoomBaby')
  .directive('ngEnter', function(StateService, PubSub) {
    var linkObj = {
      link: function(scope, element, attrs) {
        element.bind('keydown', function(event) {

          var isEnterBtn = (event.which === 13);
          var isResetBtn = (event.target.id === 'reset-password-input');
          var isChatMessage = (event.target.id === 'transport-input');

          if (isEnterBtn && isResetBtn) {
            event.preventDefault();
            PubSub.trigger('enterBtn:forgotPassword');
          };

          if (isEnterBtn && isChatMessage) {
            // PubSub.trigger('enterBtn:onChatMessage');
          }
        });
      }
    }
    return linkObj;
    ngEnter.$inject('StateService', 'PubSub');
  });
