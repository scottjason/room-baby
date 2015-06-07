angular.module('RoomBaby')
  .directive('ngEnter', function(PubSub) {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        var isEnterBtn = event.which === 13;
        var isLogin = event.target.id === 'login-input';
        var isRegister = event.target.id === 'register-input';
        if (isEnterBtn && isLogin) {
         PubSub.trigger('enterBtn:onLogin');
        } else if (isEnterBtn && isRegister) {
         PubSub.trigger('enterBtn:onRegster');
        }
      });
    };
  ngEnter.$inject('PubSub');
});
