angular.module('RoomBaby')
  .directive('ngEnter', function(pubSub) {
    return function(scope, element, attrs) {
      element.bind('keydown keypress', function(event) {
        var isEnterBtn = (event.which === 13);
        var isLogin = (event.target.id === 'login-input');
        var isRegister = (event.target.id === 'register-input');
        if (isEnterBtn && isLogin) {
          pubSub.trigger('enterBtn:onLogin');
        } else if (isEnterBtn && isRegister) {
          pubSub.trigger('enterBtn:onRegister');
        }
      });
    };
  ngEnter.$inject('pubSub');
});