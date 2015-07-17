angular.module('RoomBaby')
  .directive('ngEnter', function(PubSub) {
    return function(scope, element, attrs) {
      element.bind('keydown keypress', function(event) {

        var isEnterBtn = (event.which === 13);
        var isChatMessage = (event.target.id === 'transport-input');
        var isLogin = (event.target.id === 'login-input');
        var isRegister = (event.target.id === 'register-input');
        if (isEnterBtn && isChatMessage) {
          // PubSub.trigger('enterBtn:onChatMessage');
        } else if (isEnterBtn && isLogin) {
          // PubSub.trigger('enterBtn:onLogin');
        } else if (isEnterBtn && isRegister) {
          PubSub.trigger('enterBtn:onRegister');
        }
      });
    };
    ngEnter.$inject('PubSub');
  });
