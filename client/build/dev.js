'use strict';

angular
  .module('RoomBaby', [
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.datetimepicker',
    'ngSanitize',
    'ngDialog',
    'LocalStorageModule'
  ]);

'use strict';

angular.module('RoomBaby')
  .config(function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, localStorageServiceProvider) {

    String.prototype.capitalize = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    };

    $stateProvider
      .state('landing', {
        url: '/',
        templateUrl: 'views/landing.html',
        controller: 'LandingCtrl as landingCtrl'
      })
      .state('dashboard', {
        url: '/dashboard/:user_id',
        templateUrl: 'views/dashboard.html',
        controller: 'DashCtrl as dashCtrl'
      })
      .state('session', {
        url: '/dashboard/:user_id/',
        templateUrl: 'views/session.html',
        controller: 'SessionCtrl as sessionCtrl'
      })

    localStorageServiceProvider
      .setPrefix('RoomBaby')
      .setNotify(true, true)

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  });


'use strict';

angular.module('RoomBaby')
  .run(['$rootScope', '$window', function($rootScope, $window) {
    if ($window.innerWidth <= 900) {
      $rootScope.isDisabled = true;
    }
  }]);


'use strict';

angular.module('RoomBaby')
  .controller('DashCtrl', DashCtrl);

function DashCtrl($scope, $rootScope, $state, $stateParams, $timeout, $window, ngDialog, ConstantService, StateService, PubSub, UserApi, SessionApi, Animator, TimeService, localStorageService) {

  /* Initial Declarations */

  var ctrl = this;

  StateService.data['Facebook'].shareDialog.isOpen = false;
  StateService.data['Dashboard'].isOnLoad = true;

  $scope.room = {};
  $scope.overlay = {};
  $scope.isProcessing = {};

  $rootScope.$watch('isDisabled', function() {
    $timeout(function() {
      $scope.isDisabled = $rootScope.isDisabled ? true : false;
    });
  });

  /* PubSub */

  $rootScope.$on('isDisabled', function() {
    $timeout(function() {
      $scope.isEnabled = false;
      $scope.isDisabled = true;
    });
  });
  $rootScope.$on('isEnabled', function() {
    $timeout(function() {
      $scope.isDisabled = false;
      $scope.isEnabled = true;
    });
  });

  $scope.$watch('invalidDateErr', function() {
    if ($scope.invalidDateErr) {
      $timeout(function() {
        $scope.invalidDateErr = false;
      }, 1600);
    }
  });

  /* Dom Bound Methods */

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        $scope.user = localStorageService.get('user');
        $scope.sessions = localStorageService.get('sessions') || [];
        $scope.archives = localStorageService.get('archives') || [];
        ctrl.initialize();
      } else {
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.registerEvents = function() {
    PubSub.on('renderTable', ctrl.renderTable);
    PubSub.on('createRoomOpt', ctrl.onCreateRoomOpt);
    PubSub.on('logout', ctrl.onLogout);
    PubSub.on('createRoom:renderMessage', ctrl.renderMessage);
    PubSub.on('createRoom:renderConfirmation', ctrl.renderConfirmation);
  };

  this.getState = function(type) {
    return StateService.data[type];
  };

  this.connectNow = function() {
    var isValidName = $scope.room.name;
    var isValidGuestEmail = $scope.room.guestEmail;
    console.log(isValidName, isValidGuestEmail)
  };

  /* on dashboard option selected */
  this.onOptSelected = function($event, otSession) {
    if ($event.currentTarget.name === 'connect') {
      ctrl.connect(otSession);
    } else if ($event.currentTarget.id === 'on-create-room-confirm') {
      ctrl.createRoom();
    } else if ($event.currentTarget.id === 'on-update-room-submit') {
      ctrl.updateRoom();
    } else if ($event.currentTarget.id === 'create-broadcast-btn') {
      ctrl.createBroadcast();
    }
  };

  this.createRoomOpt = function() {
    ctrl.createRoom();
  }

  /* on dashboard table row option selected */
  this.onRowSelected = function(otSession) {
    (otSession.status === 'ready') ? ctrl.connect(otSession): ctrl.showOverlay(otSession.status);
  };

  /* date timepicker config */
  this.configDateTimePicker = function() {
    return {
      startView: 'day'
    };
  };

  /* manipulate datepicker before it renders */
  this.beforeRender = function($view, $dates, $leftDate, $upDate, $rightDate) {
    /* format the upDate */
    if ($view === 'day') {
      $upDate.display = TimeService.formatUpDate($upDate.display);
    }
    TimeService.setStartDate($dates);
  };

  /* on collect date time */
  this.onTimeSet = function(newDate, oldDate) {

    var startsAtMsUtc = newDate ? newDate.getTime() : oldDate.getTime();
    var opts = TimeService.generateOpts(startsAtMsUtc);

    TimeService.isValid(opts, function(isValid, obj) {
      if (isValid) {
        StateService.data['createRoom']['startDate'].isValid = true;
        $scope.room.isTimeSet = true;
        $scope.room.startsAt = startsAtMsUtc;
        $scope.room.startsAtFormatted = obj.localFormatted;
        $scope.room.expiresAt = obj.expiresAtMsUtc;
      } else {
        $scope.invalidDateErr = ConstantService.generateError('invalidDate');
      }
    });
  };

  /* return state of input field for copy (instructions or error) */
  this.isValidInput = function(key) {
    var isValid = StateService.data['createRoom'][key].isValid;
    var isPristine = StateService.data['createRoom'][key].isPristine;
    return (isPristine || isValid);
  };

  /* return state of input field for checkmark (field validated) */
  this.markChecked = function(key) {
    var isValid = StateService.data['createRoom'][key].isValid;
    var isPristine = StateService.data['createRoom'][key].isPristine;
    return (isValid && !isPristine);
  };

  /* return the ready state of session status, ability for user to connect */
  this.getReadyState = function(obj) {
    return (obj.status === 'ready');
  };

  this.clearForm = function() {
    $scope.room = {};
  };

  this.showTable = function() {
    var sessions = localStorageService.get('sessions');
    var archives = localStorageService.get('archives');
    var hasSessions = sessions && sessions.length;
    var hasArchives = archives && archives.length;
    return (hasSessions || hasArchives);
  };

  this.collectUserName = function() {
    if (!$scope.isProcessing.userName)
      $scope.isProcessing.userName = true;
    if ($scope.user && $scope.user.username && $scope.user.username.length >= 3 && $scope.user.username.length <= 8) {
      $scope.showLoader = true;
      var payload = {};
      payload._id = $scope.user._id;
      payload.username = $scope.user.username;
      ctrl.saveUserName(payload);
    } else {
      $timeout(function() {
        $scope.user.username = '';
        $scope.errMessage = 'invalid username';
        $scope.showErr = true;
        $timeout(function() {
          $scope.errMessage = '';
          $scope.showErr = false;
        }, 1800);

      });
      $scope.isProcessing.userName = false;
    }
  };

  this.createRoomOpt = function() {
    $scope.overlay.createRoom = true;
    $timeout(function() {
      $scope.overlay.slideUpIn = true;
      $timeout(function() {
        $scope.overlay.expand = true;
        $timeout(function() {
          $scope.showBody = true;
        }, 250);
      }, 200);
    }, 20);
  };


  this.closeOverlay = function() {
    $scope.overlay.slideUpIn = false;
    $timeout(function() {
      $scope.overlay.expand = false;
      $scope.showBody = false;
      $scope.overlay.createRoom = false;
    }, 350);
  };

  this.onCancel = function() {
    if (!$scope.isProcessing.username) {
      $scope.isProcessing.userName = true;
      UserApi.cancelAcct($scope.user._id).then(function(response) {
        $scope.isProcessing.userName = false;
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }, function(err) {
        $scope.isProcessing.userName = false;
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      });
    }
  };
  /* recursive method to get statuses of room */
  function getStatus() {
    if ($state.current.name === 'dashboard') {
      var table = StateService.data['Session'].table
      TimeService.getStatus(table, function(isSessionReady, table) {
        if (!isSessionReady) {
          $timeout(getStatus, 1000);
        } else {
          StateService.data['Session'].table = table;
          $scope.table = table;
          $timeout(getStatus, 1000);
        }
      });
    }
  }

  /* Controller Methods */

  ctrl.initialize = function() {
    if (localStorageService.get('isFacebookLogin')) {
      StateService.data['Auth'].isFacebook = true;
      ctrl.onFacebookLogin($state.params.user_id);
    } else {
      ctrl.getSessions();
      ctrl.isExpired();
      PubSub.trigger('toggleNavBar', true);
      $rootScope.$broadcast('showNavBar');
      PubSub.trigger('setUser', localStorageService.get('user'));
      var opts = Animator.generateOpts('onDashboard');
      Animator.run(opts);
      $scope.isLoaded = true;
      ctrl.renderTable();
    }
  };

  ctrl.isExpired = function() {
    TimeService.checkExpiration();
  };

  ctrl.getSessions = function() {

    if (!$scope.user) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
      return;
    }

    if (!localStorageService.get('sessions')) {
      localStorageService.set('sessions', []);
    }

    var lengthBefore = localStorageService.get('sessions').length;

    SessionApi.getAll($scope.user._id).then(function(response) {
      if (response.data.sessions) {
        var lengthAfter = response.data.sessions.length;
        if (lengthAfter > lengthBefore) {
          localStorageService.set('sessions', response.data.sessions);
          ctrl.renderTable();
        }
      }
    });
    if ($state.current.name === 'dashboard') {
      $timeout(ctrl.getSessions, 1500);
    }
  };

  ctrl.renderConfirmation = function() {
    var opts = {
      type: 'onRenderConfirmation'
    };
    Animator.run(opts, function() {
      $scope.showConfirmation = true;
    });
  };

  ctrl.onLogout = function() {
    $scope.isLogout = true;
  };

  ctrl.onCreateRoomOpt = function(isNow) {
    if (isNow) {
      var isValidName = StateService.data['createRoom']['name'].isValid;
      var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
      if (isValidName && isValidEmail) {
        var fiveMinutes = 300000;
        $scope.room.isTimeSet = true;
        $scope.room.startsAt = new Date().getTime();
        $scope.room.startsAtFormatted = moment(new Date().getTime()).format("dddd, MMMM Do YYYY, h:mm a");
        $scope.room.expiresAt = (new Date().getTime() + fiveMinutes);
        StateService.data['createRoom']['formData'].isValid = true;
        $scope.room.startsAt = new Date().getTime();
        ctrl.renderConfirmation();
      }
    } else {
      var opts = {
        type: 'onShowCalendar'
      };
      Animator.run(opts, function() {
        $scope.showCalendar = true;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    }
  };

  /* on invite form update option selected */
  ctrl.updateRoom = function() {
    $scope.room.startsAt = false;
    $scope.room.startsAtFormatted = '';
    $scope.room.isTimeSet = false;
    StateService.data['createRoom']['startDate'].isValid = false;
    StateService.data['createRoom']['formData'].isValid = false;
  };

  /* on invite form complete, create the room, save to mongo */
  ctrl.createRoom = function() {
    var opts = Animator.generateOpts('onRenderLoading');
    Animator.run(opts);
    $scope.showCalendar = false;
    $scope.showLoading = true;
    var payload = angular.copy($scope.room);
    payload.host = angular.copy($scope.user);
    SessionApi.createRoom(payload).then(function(response) {
      var obj = {};
      obj.type = 'onOverlayExit';
      Animator.run(obj);
      $scope.showLoading = false;
      $timeout(function() {
        StateService.data['createRoom']['name'].text = '';
        StateService.data['createRoom']['guestEmail'].text = '';
        StateService.data['createRoom']['startDate'].isValid = false;
        StateService.data['createRoom']['name'].isValid = false;
        StateService.data['createRoom']['guestEmail'].isValid = false;
        StateService.data['createRoom']['formData'].isValid = false;
        StateService.data['overlay'].isOpen = false;
        $scope.room = {};
        $scope.showConfirmation = false;
      }, 1200);
    }, function(err) {
      console.log(err)
    });
  };

  ctrl.createBroadcast = function() {
    SessionApi.createBroadcast(localStorageService.get('user')).then(function(response) {
      var url = SessionApi.generateBroadcastUrl(response.data._id);
      // var url = 'localhost:3001/' + response.data._id;
      window.open(url, '_blank');
    })
  };

  /* render table (or re-render after save room) */
  ctrl.renderTable = function(isOnLoad) {
    $scope.showTable = true;
    var sessions = localStorageService.get('sessions');
    var archives = localStorageService.get('archives');
    TimeService.generateTable(sessions, archives, function(table) {
      StateService.data['Session'].table = table;
      $timeout(function() {
        $scope.table = table;
      });
    });
    var isOnLoad = StateService.data['Dashboard'].isOnLoad;
    if (isOnLoad) {
      StateService.data['Dashboard'].isOnLoad = false;
      getStatus();
    }
  };

  ctrl.renderMessage = function(binding, message) {
    $timeout(function() {
      $scope[binding] = message;
      $timeout(function() {
        $scope[binding] = '';
      }, 1600);
    });
  };

  ctrl.onFacebookLogin = function(user_id) {
    UserApi.getAll(user_id).then(function(response) {
      if (response.status === 200) {
        $scope.user = response.data.user;
        localStorageService.set('user', $scope.user);
        localStorageService.set('sessions', response.data.sessions || []);
        localStorageService.set('archives', response.data.archives || []);
        PubSub.trigger('setUser', $scope.user);
        if (!$scope.user.username) {
          ctrl.getUserName();
        } else {
          ctrl.getSessions();
          ctrl.isExpired();
          $rootScope.$broadcast('showNavBar');
          PubSub.trigger('toggleNavBar', true);
          var obj = {};
          obj.type = 'onDashboard';
          Animator.run(obj);
          $scope.isLoaded = true;
          ctrl.renderTable();
        }
      } else {
        $rootScope.$broadcast('hideNavBar');
        PubSub.trigger('toggleNavBar', null);
        PubSub.trigger('toggleFooter', null);
        localStorageService.clearAll();
        $state.go('landing');
      }
    }, function(err) {
      console.log(err);
    });
  };

  ctrl.getUserName = function(callback) {
    $scope.showOverlay = true;
    $rootScope.$broadcast('hideNavBar');
    $scope.showOverlay = true;
    $timeout(function() {
      $scope.overlay.slideUpIn = true;
      $timeout(function() {
        $scope.overlay.expand = true;
        $timeout(function() {
          $scope.showBody = true;
        }, 250);
      }, 200);
    }, 20);
  };

  ctrl.saveUserName = function(payload) {
    console.log('saveUserName', payload);
    console.log(payload);
    UserApi.saveUserName(payload).then(function(response) {
      localStorageService.remove('isFacebookLogin');
      var user = response.data.user;
      PubSub.trigger('setUser', user);
      $scope.user = user;
      localStorageService.set('user', user);
      ctrl.onUserNameSuccess();
      $scope.isProcessing.userName = false;
    });
  };

  ctrl.onUserNameSuccess = function() {
    ctrl.getSessions();
    ctrl.isExpired();
    $scope.showOverlay = false;
    $scope.overlay.slideUpIn = false;
    $scope.overlay.expand = false;
    $scope.showBody = false;
    $timeout(function() {
      $rootScope.$broadcast('showNavBar');
      $scope.isLoaded = true;
      PubSub.trigger('toggleNavBar', true);
      var obj = {};
      obj.type = 'onDashboard';
      Animator.run(obj);
      ctrl.renderTable();
    }, 350);
  };

  ctrl.connect = function(otSession) {
    localStorageService.set('otSession', otSession);
    var opts = {
      user_id: $scope.user._id
    };
    $state.go('session', opts);
  };

  DashCtrl.$inject['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$window', 'ngDialog', 'ConstantService', 'StateService', 'PubSub', 'UserApi', 'SessionApi', 'Animator', 'TimeService', 'localStorageService'];
}


'use strict';

angular.module('RoomBaby')
  .controller('FooterCtrl', FooterCtrl);

function FooterCtrl($scope, $rootScope, $window, $timeout, PubSub, Validator, SessionApi, Animator, StateService, localStorageService) {

  var ctrl = this;

  $scope.$watch('showFeatureDisabled', function() {
    if ($scope.showFeatureDisabled) {
      $timeout(function() {
        $scope.showFeatureDisabled = false;
      }, 2600);
    }
  });

  this.registerEvents = function() {
    PubSub.on('toggleFooter', ctrl.toggleFooter);
    PubSub.on('setUser', ctrl.setUser);
    PubSub.on('isRecording', ctrl.isRecording);
    PubSub.on('featureDisabled', ctrl.featureDisabled);
    PubSub.on('generatingVideo', ctrl.onGeneratingVideo);
    StateService.data['Controllers'].Footer.isReady = true;
  };

  this.getEmail = function() {
    return localStorageService.get('user').email || localStorageService.get('user').facebook.email
  };

  this.onRegister = function() {
    console.log('onRegister', $scope.user);
  };

  this.onOptSelected = function(optSelected) {
    var isEnabled = ($rootScope.connectionCount > 1);
    if (optSelected === 'disconnect') {
      PubSub.trigger('disconnect');
    } else if (!isEnabled) {
      $scope.showFeatureDisabled = true;
    } else if (optSelected === 'record') {
      PubSub.trigger('requestPermission');
    } else if (optSelected === 'stop') {
      PubSub.trigger('stopRecording');
    } else if (optSelected === 'upload') {
      PubSub.trigger('toggleOverlay');
      PubSub.trigger('toggleUpload', true);
    } else if (optSelected === 'stop') {

    }
  };

  this.collectUpload = function() {

    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;

      var sessionId = localStorageService.get('otSession').sessionId;
      var userId = localStorageService.get('user')._id;

      /* Verify again on server along with file type */
      SessionApi.upload($scope.fileUpload, userId, sessionId).then(function(response) {
        if (response.status === 200) {
          $scope.fileUrl = response.data;
          $scope.showLoadingSpinner = false;
          PubSub.trigger('toggleOverlay');
          PubSub.trigger('toggleUpload', null);
          $timeout(ctrl.shareFile, 700);
        } else if (response.status === 401) {
          console.error(401, response)
        }
      }, function(err) {
        console.error(err);
      });
    }
  };

  this.getEmail = function() {
    return localStorageService.get('user').email || localStorageService.get('user').facebook.email;
  };

  ctrl.setUser = function(user) {
    $scope.user = user;
  };

  this.onCancelUsername = function() {
    PubSub.trigger('cancelUsername', localStorageService.get('user')._id);
  };

  ctrl.toggleFooter = function(showFooter) {
    $scope.showFooter = showFooter;
    if (showFooter) {
      var obj = {};
      obj.type = 'onFooterOverlay';
      obj.callback = onSuccess;
      Animator.run(obj)

      function onSuccess() {
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }
  };

  ctrl.isRecording = function(isRecording) {
    $scope.isRecording = isRecording;
  };

  ctrl.shareFile = function() {
    PubSub.trigger('shareFile', $scope.fileUrl);
  };

  ctrl.featureDisabled = function() {
    $scope.showFeatureDisabled = true;
  };

  ctrl.onGeneratingVideo = function(_bool) {
    $scope.showGeneratingVideo = _bool;
  }

  FooterCtrl.$inject['$scope', '$rootScope', '$window', '$timeout', 'PubSub', 'Validator', 'SessionApi', 'Animator', 'StateService', 'localStorageService'];
}


'use strict';

angular.module('RoomBaby')
  .controller('GlobalCtrl', GlobalCtrl);

function GlobalCtrl($scope, PubSub, DeviceService) {

  $scope.isMobile = function() {
    return DeviceService.isMobile();
  };

  $scope.registerEvents = function() {
    PubSub.on('toggleOverflow', function(_bool) {
      $scope.showOverflow = _bool;
    });
  };
  GlobalCtrl.$inject['$scope', 'PubSub', 'DeviceService'];
}


'use strict';

angular.module('RoomBaby')
  .controller('LandingCtrl', LandingCtrl);

function LandingCtrl($scope, $rootScope, $state, $window, $timeout, Validator, StateService, ConstantService, DeviceService, UserApi, PubSub, Animator, localStorageService) {

  var ctrl = this;
  $scope.overlay = {};

  console.log('RootScope', $rootScope)
  if ($rootScope.isDisabled) {
    $scope.isEnabled = false;
    $scope.isDisabled = true;
  }

  $rootScope.$on('isDisabled', function() {
    console.log('Landing Ctrl, isDisabled');
    $timeout(function() {
      $scope.isEnabled = false;
      $scope.isDisabled = true;
    });
  });

  $rootScope.$on('isEnabled', function() {
    console.log('Landing Ctrl, isEnabled');
    $timeout(function() {
      $scope.isDisabled = false;
      $rootScope.isDisabled = false;
      $scope.isEnabled = true;
    });
  });

  this.openOverlay = function() {
    console.log('Landing Ctrl, openOverlay');
    $rootScope.$broadcast('hideNavBar');
    $scope.showOverlay = true;
    $timeout(function() {
      $scope.overlay.slideUpIn = true;
      $timeout(function() {
        $scope.overlay.expand = true;
        $timeout(function() {
          $scope.showBody = true;
        }, 250);
      }, 200);
    }, 20);
  };

  this.closeOverlay = function() {
    $scope.overlay.expand = false;
    $scope.overlay.slideUpIn = false;
    $scope.showOverlay = false;
    $scope.showBody = false;
    $scope.showOverlay = false;
  };

  this.isMobile = function() {
    return DeviceService.isMobile();
  };

  this.onReady = function() {
    console.log('Landing Ctrl, onReady');
    PubSub.trigger('toggleOverflow', null);
    PubSub.on('enterBtn:forgotPassword', this.onForgotPassword);
    StateService.data['Controllers'].Landing.isReady = true;
  };

  this.isAuthenticated = function() {
    console.log('Landing Ctrl, isAuthenticated');
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        localStorageService.clearAll();
        ctrl.initialize();
      } else {
        localStorageService.clearAll();
        ctrl.initialize();
      }
    }, function(err) {
      localStorageService.clearAll();
      ctrl.initialize();
    });
  };

  this.getState = function() {
    console.log('Landing Ctrl, getState');

    function getState() {
      var isFooterReady = StateService.data['Controllers'].Footer.isReady;
      var isNavReady = StateService.data['Controllers'].Navbar.isReady;
      if (isFooterReady && isNavReady) {
        PubSub.trigger('toggleNavBar', false);
        PubSub.trigger('toggleFooter', false);
      } else {
        $timeout(getState, 200);
      }
    }
    getState();
  };

  this.onOptSelected = function(optSelected) {
    $scope.showErr = null;
    $scope.errMessage = '';
    console.log('optSelected', optSelected);
    $scope.user = {};
    if (optSelected === 'login') {
      $scope.showRegister = false;
      $scope.showLogin = true;
      var hasAnimated = StateService.data['Animator']['login'].hasAnimated;
      if (!hasAnimated) {
        StateService.data['Animator']['login'].hasAnimated = true;
        var opts = Animator.generateOpts('onLogin');
        Animator.run(opts);
        $timeout(function() {
          var elem = angular.element(document.getElementById('login-input-email'));
          elem.focus();
        }, 200);
      }
    } else if (optSelected === 'register') {
      $scope.showLogin = false;
      $scope.showRegister = true;
      var hasAnimated = StateService.data['Animator']['register'].hasAnimated;
      if (!hasAnimated) {
        StateService.data['Animator']['register'].hasAnimated = true;
        var opts = Animator.generateOpts('onRegister');
        Animator.run(opts);
      }
    } else if (optSelected === 'facebook') {
      localStorageService.set('isFacebookLogin', true);
      $window.location.href = $window.location.protocol + '//' + $window.location.host + $window.location.pathname + 'auth/facebook';
    } else if (optSelected === 'forgotPassword') {
      $scope.showForgotPassword = true;
    } else if (optSelected === 'roomBaby') {
      ctrl.reset();
    } else if (optSelected === 'works') {
      ctrl.onHowThisWorks();
    }
  };

  this.validateLogin = function() {
    var inProgress = StateService.data['Auth'].Login.inProgress;
    if (!inProgress) {
      StateService.data['Auth'].Login.inProgress = true;
      var opts = Validator.generateOpts('login', $scope.user);
      Validator.validate(opts, function(isValid, badInput, errMessage) {
        if (isValid) {
          $scope.showLoader = true;
          ctrl.login(opts);
        } else {
          $scope.showErr = true;
          $scope.errMessage = errMessage;
          $timeout(function() {
            $scope.showErr = false;
            $scope.errMessage = '';
            var elem = (badInput !== 'password') ? angular.element(document.getElementById('login-input-email')) : angular.element(document.getElementById('login-input-password'));
            elem.focus();
            StateService.data['Auth'].Login.inProgress = false;
          }, 1200);
        }
      });
    }
  };

  this.validateRegistration = function() {
    var inProgress = StateService.data['Auth'].Registration.inProgress;
    if (!inProgress) {
      StateService.data['Auth'].Registration.inProgress = true;
      var opts = Validator.generateOpts('register', $scope.user);
      Validator.validate(opts, function(isValid, badInput, errMessage) {
        if (isValid) {
          ctrl.register(opts);
        } else {
          $scope.user[badInput] = '';
          $scope.showErr = true;
          $scope.errMessage = errMessage;
          $timeout(function() {
            $scope.showErr = null;
            $scope.errMessage = '';
            StateService.data['Auth'].Registration.inProgress = false;
          }, 1200);
          ($scope.$parent.$$phase === '$apply') ? null: $scope.$apply();
        }
      });
    }
  };

  this.onForgotPassword = function(isCanceled) {
    if (!isCanceled) {
      var opts = Validator.generateOpts('email', $scope.user.email);
      Validator.validate(opts, function(isValid) {
        if (!isValid) {
          var errMessage = ConstantService.generateError('invalidEmail');
          $timeout(function() {
            ctrl.renderError(errMessage);
          })
        } else {
          $scope.showLoader = true;
          UserApi.resetPassword($scope.user).then(function(response) {
            $scope.showLoader = false;
            if (response.status === 401) {
              ctrl.renderError(response.data);
            } else {
              $scope.resetMessage = response.data;
            }
          });
        }
      });
    } else {
      $scope.showForgotPassword = false;
      ctrl.initialize();
    }
  };

  ctrl.initialize = function() {
    console.log('init called');
    $scope.showRegister = false;
    $scope.showLogin = false;
    $scope.showLanding = true;
    var hasAnimated = StateService.data['Animator']['landing'].hasAnimated;
    if (hasAnimated) {
      var opts = Animator.generateOpts('onLanding', true);
      Animator.run(opts);
    } else {
      StateService.data['Animator']['landing'].hasAnimated = true;
      var opts = Animator.generateOpts('onLanding', null);
      Animator.run(opts);
    }
  };

  ctrl.reset = function(refreshPage) {
    console.log('reset called', refreshPage);
    StateService.data['Animator']['login'].hasAnimated = false;
    StateService.data['Auth'].Login.inProgress = false;
    StateService.data['Auth'].Registration.inProgress = false;
    localStorageService.clearAll();
    if (!refreshPage) {
      $state.go($state.current, {}, {
        reload: true
      });
    } else {
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    }
  };

  ctrl.login = function(opts) {
    console.log('login', opts);
    UserApi.login(opts).then(function(response) {
      if (response.status == 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions || []);
        localStorageService.set('archives', response.data.archives || []);
        var accessOpts = UserApi.generateOpts(response.data.user);
        $scope.showLoader = false;
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        console.log('status', 401);
        $scope.showLoader = false;
        $scope.user = {};
        angular.element(document.getElementById('login-input-email'))
        ctrl.renderError(response.data.message)
      } else {
        $scope.showLoader = false;
        ctrl.reset(true);
      }
    }, function(err) {
      $scope.showLoader = false;
      ctrl.reset(true);
    });
  };

  ctrl.register = function(opts) {
    UserApi.register(opts).then(function(response) {
      if (response.status === 200) {
        localStorageService.set('user', response.data.user);
        localStorageService.set('sessions', response.data.sessions);
        localStorageService.set('archives', response.data.archives || []);
        var accessOpts = UserApi.generateOpts(response.data.user);
        ctrl.grantAccess(accessOpts);
      } else if (response.status === 401) {
        $scope.user = {};
        ctrl.renderError(response.data.message);
      } else {
        ctrl.reset(true);
      }
    }, function(err) {
      ctrl.reset(true);
    });
  };

  ctrl.onHowThisWorks = function() {
    PubSub.trigger('toggleOverflow', true);
    $state.go('work');
  };

  ctrl.grantAccess = function(opts) {
    $scope.user = {};
    StateService.data['Auth'].Login.inProgress = false
    StateService.data['Auth'].Registration.inProgress = false
    $state.go('dashboard', opts);
  };

  ctrl.renderError = function(errMessage) {
    $scope.showErr = true;
    $scope.errMessage = errMessage;
    $timeout(function() {
      $scope.errMessage = '';
      $scope.showErr = false;
      StateService.data['Auth'].Login.inProgress = false;
      StateService.data['Auth'].Registration.inProgress = false;
    }, 1200);
  };

  LandingCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'Validator', 'StateService', 'ConstantService', 'DeviceService', 'UserApi', 'PubSub', 'Animator', 'localStorageService'];
};


'use strict';

angular.module('RoomBaby')
  .controller('NavBarCtrl', NavBarCtrl);

function NavBarCtrl($scope, $rootScope, $state, $timeout, $window, StateService, UserApi, PubSub, ngDialog, localStorageService) {


  var ctrl = this;

  $scope.user = localStorageService.get('user');

  $rootScope.$on('hideNavBar', function() {
    console.log('hideNavBar');
    $scope.hideNavBar = true;
  });

  $rootScope.$on('showNavBar', function() {
    console.log('showNavBar');
    $scope.hideNavBar = false;
    $scope.showNavBar = true;
  });
  $rootScope.$on('isDisabled', function() {
    console.log('Navbar isDisabled');
    $timeout(function() {
      $scope.isEnabled = false;
      $scope.isDisabled = true;
    });
  });
  $rootScope.$on('isEnabled', function() {
    console.log('Navbar isEnabled');
    $timeout(function() {
      $scope.isDisabled = false;
      $scope.isEnabled = true;
    });
  });

  this.registerEvents = function() {
    $scope.fadeToBlack = false;
    PubSub.on('toggleNavBar', ctrl.toggleNavBar);
    PubSub.on('toggleOverlay', ctrl.toggleOverlay);
    PubSub.on('onBroadcast', ctrl.onBroadcast);
    PubSub.on('setUser', ctrl.setUser);
    PubSub.on('cancelUsername', ctrl.logout);
    PubSub.on('timeLeft', ctrl.setTimeLeft);
    StateService.data['Controllers'].Navbar.isReady = true;
  };

  this.createRoom = function() {
    PubSub.trigger('Dashboard:CreateRoom');
  };

  this.dropdown = function(opt) {
    if (opt === 'logout') {
      var userId = localStorageService.get('user')._id;
      ctrl.logout(userId);
    } else if (opt === 'upload') {
      ctrl.toggleUpload(null);
    }
  };

  this.toggleLogout = function(showLogout) {
    $scope.showLogout = !$scope.showLogout;
  }

  this.setTimeLeft = function(timeLeft, thirtySecondsLeft, twentySecondsLeft) {
    $scope.timeLeft = ($rootScope.isDissconected || timeLeft === '0 minutes and 0 seconds left') ? '' : timeLeft;
    $scope.thirtySecondsLeft = thirtySecondsLeft;
    $scope.twentySecondsLeft = twentySecondsLeft;
  };

  this.isThirtySecondsLeft = function() {
    if ($rootScope.isDissconected || $scope.twentySecondsLeft) {
      return false;
    } else {
      return $scope.thirtySecondsLeft;
    }
  };

  this.isTwentySecondsLeft = function() {
    if ($rootScope.isDissconected) {
      return false;
    } else if ($rootScope.isRecording && $scope.twentySecondsLeft) {
      $rootScope.isRecording = false;
      // PubSub.trigger('stopRecording');
      return true;
    } else if ($scope.twentySecondsLeft) {
      return true;
    }
  };

  this.getTimeLeft = function() {
    return $scope.timeLeft || '';
  };

  this.getProfileImg = function() {
    if (localStorageService.get('user')) {
      return localStorageService.get('user').profileImage;
    }
  };

  this.getUserName = function() {
    if (localStorageService.get('user')) {
      return localStorageService.get('user').username;
    } else {
      return '';
    }
  };


  this.collectUpload = function() {

    if (!$scope.fileUpload) {
      console.error('!$scope.fileUpload');
    } else if ($scope.fileUpload.size > 5e+6) { /* 5e+6 bytes === 5mb */
      console.error('maxSizeExceeded');
    } else {
      $scope.showLoadingSpinner = true;

      var userId = localStorageService.get('user')._id;

      /* Verify again on server along with file type */
      UserApi.upload($scope.fileUpload, userId).then(function(response) {
        if (response.status === 200) {
          var user = localStorageService.get('user');
          user.profileImage = response.data;
          localStorageService.set('user', user);
          $scope.showLoadingSpinner = false;
          ctrl.toggleUpload(true);
        } else if (response.status === 401) {
          console.error(401, response)
        }
      }, function(err) {
        console.error(err);
      });
    }
  };

  ctrl.toggleUpload = function(isOpen) {
    if (!isOpen) {
      ngDialog.openConfirm({
        template: '../../views/ngDialog/profile-image.html',
        controller: 'NavBarCtrl'
      });
    } else {
      ngDialog.closeAll();
    }
  };


  ctrl.onBroadcast = function() {
    $scope.showBroadcast = true;
  };

  ctrl.toggleOverlay = function() {
    $scope.showOverlay = !$scope.showOverlay;
  };

  ctrl.toggleNavBar = function(_bool) {
    $scope.showNavBar = _bool;
  };

  ctrl.setUser = function(user) {
    console.log('set user', user)
    $timeout(function() {
      $scope.user = localStorageService.get('user');
    });
  };

  ctrl.logout = function(user_id) {
    PubSub.trigger('logout');
    UserApi.logout(user_id).then(function(response) {
      localStorageService.clearAll();
      var isProduction = ($window.location.host.indexOf('room-baby.com') !== -1);
      if (isProduction) {
        $window.location.href = 'http://www.room-baby.com';
      } else {
        $window.location.href = 'http://localhost:3000';
      }
    });
  };

  NavBarCtrl.$inject['$scope', '$rootScope', '$state', '$timeout', '$window', 'StateService', 'UserApi', 'PubSub', 'ngDialog', 'localStorageService'];
}


'use strict';

angular.module('RoomBaby')
  .controller('SessionCtrl', SessionCtrl);

function SessionCtrl($scope, $rootScope, $state, $window, $timeout, FacebookService, StateService, ArchiveService, ConstantService, TimeService, ngDialog, UserApi, SessionApi, PubSub, Transport, localStorageService) {

  var ctrl = this;
  var now = moment(new Date()).calendar();

  $rootScope.connectionCount = 0;

  $rootScope.$on('isDisabled', function() {
    $timeout(function() {
      $scope.isEnabled = false;
      $scope.isDisabled = true;
    });
  });
  $rootScope.$on('isEnabled', function() {
    $timeout(function() {
      $scope.isDisabled = false;
      $scope.isEnabled = true;
    });
  });

  var chatbox = angular.element(document.getElementById('chatbox'));
  var layoutContainer = document.getElementById('layout-container');
  var layoutOpts = ConstantService.generateOpts('layout');

  var layout = TB.initLayoutContainer(layoutContainer, layoutOpts).layout;

  $window.onresize = function() {
    var resizeCams = function() {
      layout();
    }
    $timeout(resizeCams, 20);
  };

  this.isAuthenticated = function() {
    UserApi.isAuthenticated().then(function(response) {
      if (response.status === 200) {
        ctrl.initialize();
      } else if (response.status === 401) {
        localStorageService.clearAll();
        $state.go('landing');
      } else {
        localStorageService.clearAll();
        $window.location.href = $window.location.protocol + '//' + $window.location.host;
      }
    }, function(err) {
      localStorageService.clearAll();
      $window.location.href = $window.location.protocol + '//' + $window.location.host;
    });
  };

  this.sendMessage = function() {
    if ($rootScope.connectionCount < 2) {
      $scope.user.message = '';
      PubSub.trigger('featureDisabled');
    } else {
      Transport.generateMessage($scope.user, function(chatMessage) {
        $scope.user.message = '';
        ctrl.broadcast('chatMessage', chatMessage);
      });
    }
  };

  ctrl.initialize = function() {

    $rootScope.isDissconected = false;
    $scope.user = localStorageService.get('user');
    $scope.otSession = localStorageService.get('otSession');

    PubSub.on('shareFile', ctrl.shareFile);
    PubSub.on('requestPermission', ctrl.requestPermission);
    PubSub.on('stopRecording', ctrl.stopRecording);
    PubSub.on('disconnect', ctrl.disconnect);
    PubSub.on('toggleUpload', ctrl.toggleUpload);
    // PubSub.on('enterBtn:onChatMessage', this.sendMessage);
    PubSub.trigger('toggleNavBar', true);
    PubSub.trigger('setUser', $scope.user);

    ctrl.isExpired($scope.otSession.expiresAtMsUtc);
    ctrl.createSession($scope.otSession);
  };

  ctrl.isExpired = function(expiresAtMsUtc) {

    $scope.expiresAtMsUtc = $scope.expiresAtMsUtc ? $scope.expiresAtMsUtc : expiresAtMsUtc;

    function getStatus() {
      TimeService.isExpired($scope.expiresAtMsUtc, function(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft) {
        isExpired ? ctrl.disconnect() : ctrl.renderCountDown(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft);
      });
    }
    getStatus();
  };

  ctrl.renderCountDown = function(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft) {
    if (!isExpired) {
      var timeLeft = TimeService.generateTimeLeft(msLeft);
      PubSub.trigger('timeLeft', timeLeft, thirtySecondsLeft, twentySecondsLeft);
      $timeout(ctrl.isExpired, 1000);
    }
  };

  ctrl.createSession = function(otSession) {
    if (OT.checkSystemRequirements() === 0) {
      console.error('The client does not support WebRTC.');
    } else {
      $scope.session = OT.initSession(otSession.key, otSession.sessionId);
      ctrl.registerEvents(otSession);
    }
  };

  ctrl.registerEvents = function(otSession) {
    $scope.session.on('connectionCreated', function(event) {
      console.debug('connectionCreated');
      $rootScope.connectionCount++
        if (event.connection.creationTime < $scope.session.connection.creationTime) {
          localStorageService.set('connectionObj', event.connection);
          $scope.connectionObj = event.connection;
        }
      if (event.connection.creationTime > $scope.session.connection.creationTime) {
        $scope.connectionObj = event.connection;
      }
      if ($rootScope.connectionCount > 1) {
        console.log($scope.user);
        ctrl.emit('onConnected', $scope.user.username || localStorageService.get('user').username);
      }
    });

    $scope.session.on('streamCreated', function(event) {
      console.debug('streamCreated');
      $scope.session.subscribe(event.stream, 'layout-container', {
        insertMode: 'append'
      });
      layout();
    });

    $scope.session.on('streamDestroyed', function(event) {
      console.debug('Stream ' + event.stream.name + ' ended. ' + event.reason);
    });

    $scope.session.on('sessionDisconnected', function(event) {
      $rootScope.connectionCount--;
      console.debug('sessionDisconnected');
      var opts = {
        user_id: $scope.user._id
      };
      ctrl.routeToDashboard(opts);
    });

    $scope.session.on('connectionDestroyed', function(event) {
      console.debug('connection destroyed.');
      $rootScope.connectionCount--;
      var userId = localStorageService.get('user')._id;
      SessionApi.getAll(userId).then(function(response) {
        var sessions = (response.data && response.data.sessions) ? response.data.sessions : null;
        localStorageService.set('sessions', sessions);
        $scope.session.disconnect();
      });
    });

    $scope.session.on('signal:onConnected', function(event) {
      var opts = Transport.generateOpts('onConnected', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:chatMessage', function(event) {
      var opts = Transport.generateOpts('chatMessage', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:requestPermission', function(event) {
      var isSelf = (event.data === $scope.user.username)
      if (!isSelf) {
        $scope.requestingUser = event.data;
        $scope.showPermission = true;
      }
    });

    $scope.session.on('signal:permissionResponse', function(event) {
      var opts = Transport.generateOpts('sendReceipt', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
      });
    });

    $scope.session.on('signal:startRecording', function() {
      PubSub.trigger('isRecording', true);
    });

    $scope.session.on('signal:stopRecording', function(event) {
      $rootScope.isRecording = true;
      PubSub.trigger('isRecording', false);
      PubSub.trigger('generatingVideo', true);
    });

    $scope.session.on('signal:archive', function(event) {
      var archive = JSON.parse(event.data);
      localStorageService.set('archive', archive);
    });

    $scope.session.on('signal:getAllArchives', function(event) {
      var user_id = localStorageService.get('user')._id;
      ctrl.getAllArchives(user_id);
    });

    $scope.session.on('signal:shareVideo', function(event) {
      PubSub.trigger('generatingVideo', false);
      localStorageService.set('videoUrl', event.data);
      var opts = Transport.generateOpts('shareVideo', event.data);
      Transport.generateHtml(opts, function(html) {
        chatbox.append(html);
        Transport.scroll('down');
        var isFacebookLogin = StateService.data['Auth'].isFacebook;
        // var isOpen = StateService.data['Facebook'].shareDialog.isOpen;
        if (isFacebookLogin) {
          ctrl.openShareDialog();
        } else {
          console.log('user not logged in through facebook');
        }
      });
    });

    $scope.session.on('signal:shareFile', function(event) {
      var obj = {};
      var data = JSON.parse(event.data);
      var sentBy = data.sentBy
      if (sentBy !== $scope.user.username) {
        obj.type = 'shareFile';
        obj.sentBy = sentBy;
        obj.fileUrl = data.fileUrl;
        obj.timeSent = data.timeSent;
        Transport.generateHtml(obj, function(html) {
          chatbox.append(html);
          Transport.scroll('down');
        });
      } else {
        obj.type = 'sendReceipt';
        obj.receiptType = 'shareFile';
        Transport.generateHtml(obj, function(html) {
          chatbox.append(html);
          Transport.scroll('down');
        });
      }
    });
    ctrl.createConnection(otSession);
  };

  ctrl.createConnection = function(otSession) {
    $scope.session.connect(otSession.token, function(err) {
      if (err) {
        console.error('error connecting: ', err.code, err.message);
      } else {
        var pubElem = document.createElement('div');
        var publisher = OT.initPublisher(pubElem, {
          resolution: '1280x720'
        }, function(err) {
          if (err) console.error(err);
          $scope.session.publish(publisher);
          layoutContainer.appendChild(pubElem);
          layout();
          localStorageService.set('publisher', publisher);
          ctrl.pubCallback();
        });
      }
    });
  };

  ctrl.pubCallback = function() {
    PubSub.trigger('toggleFooter', true);
  };

  ctrl.requestPermission = function() {
    var permissionRequestedBy = $scope.user.username;
    ctrl.broadcast('requestPermission', permissionRequestedBy);
  };

  this.onPermissionResponse = function(isGranted) {
    $scope.showPermission = false;
    if (isGranted) {
      ctrl.broadcast('permissionResponse', 'granted');
      var otSessionId = localStorageService.get('otSession').sessionId;
      ctrl.startRecording(otSessionId);
    } else {
      ctrl.broadcast('permissionResponse', 'denied');
    }
  };

  ctrl.startRecording = function(otSessionId) {
    SessionApi.startRecording(otSessionId).then(function(response) {
      ctrl.broadcast('startRecording', '');
      localStorageService.set('archive', response.data);
      var archiveMessage = JSON.stringify(response.data);
      ctrl.emit('archive', archiveMessage);
    }, function(err) {
      console.log(err);
    });
  };


  ctrl.stopRecording = function() {
    ctrl.broadcast('stopRecording', '');
    var archiveId = localStorageService.get('archive').id;
    SessionApi.stopRecording(archiveId).then(function(response) {
      localStorageService.set('archiveResponse', response.data);
      ctrl.getVideoStatus(archiveId);
    });
  };

  ctrl.getVideoStatus = function(archiveId) {
    $scope.archiveId = archiveId ? archiveId : $scope.archiveId
    SessionApi.getVideoStatus($scope.archiveId).then(function(response) {
      console.log(response);
      var isReady = response.data.isReady;
      if (isReady) {
        var videoUrl = response.data.video.url;
        localStorageService.set('videoUrl', videoUrl);
        ctrl.broadcast('shareVideo', videoUrl);
        ctrl.createArchive();
      } else {
        $timeout(ctrl.getVideoStatus, 300);
      }
    }, function(err) {
      console.error(err);
    });
  };

  ctrl.createArchive = function() {
    ArchiveService.generateOpts(function(opts) {
      ArchiveService.createArchive(opts).then(function(response) {
        var archives = localStorageService.get('archives');
        archives.push(response.data);
        localStorageService.set('archives', archives);
        ctrl.emit('getAllArchives', '');
      }, function(err) {
        console.error(err);
      })
    });
  };

  ctrl.getAllArchives = function(user_id) {
    ArchiveService.getAll(user_id).then(function(response) {
      localStorageService.set('archives', response.data);
    });
  };

  ctrl.openShareDialog = function() {
    StateService.data['Facebook'].shareDialog.isOpen = true;
    var href = FacebookService.generateHref();
    localStorageService.set('href', href);
    FacebookService.openShareDialog(href);
  };

  ctrl.toggleUpload = function(isClosed) {
    if (isClosed) {
      ngDialog.openConfirm({
        template: '../../views/ngDialog/upload.html',
        controller: 'FooterCtrl'
      });
    } else {
      ngDialog.closeAll();
    }
  };

  ctrl.shareFile = function(fileUrl) {
    var obj = {};
    obj.sentBy = $scope.user.username;
    obj.fileUrl = fileUrl;
    var timeSent = angular.copy(now);
    timeSent = timeSent.split(' ');
    timeSent.splice(0, 2);
    timeSent = timeSent.join(' ');
    obj.timeSent = timeSent;
    var messageString = JSON.stringify(obj);
    ctrl.broadcast('shareFile', messageString);
  };

  ctrl.disconnect = function() {
    $rootScope.isDissconected = true;
    var sessionId = localStorageService.get('otSession')._id;
    var userId = localStorageService.get('user')._id;
    ctrl.deleteRoom(sessionId, userId);
  };

  ctrl.deleteRoom = function(session_id, user_id) {
    var sessions = [];
    SessionApi.deleteRoom(session_id, user_id).then(function(response) {
      console.log('response', response);
      localStorageService.set('sessions', response.data.sessions);
      $scope.session.disconnect();
    }, function(err) {
      console.error(err);
    });
  };

  ctrl.routeToDashboard = function(opts) {
    PubSub.trigger('toggleFooter', false);
    $window.location.href = $window.location.protocol + '//' + $window.location.host + $window.location.pathname;
  };

  ctrl.emit = function(type, message) {
    $scope.session.signal({
      to: $scope.connectionObj,
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };

  ctrl.broadcast = function(type, message) {
    $scope.session.signal({
      type: type,
      data: message,
    }, function(err) {
      if (err) console.error('signal error ( ' + err.code + ' ) : ' + err.reason);
    });
  };

  SessionCtrl.$inject['$scope', '$rootScope', '$state', '$window', '$timeout', 'FacebookService', 'StateService', 'ArchiveService', 'ConstantService', 'TimeService', 'ngDialog', 'UserApi', 'SessionApi', 'PubSub', 'Transport', 'localStorageService'];
}


angular.module('RoomBaby')
  .factory('ArchiveService', function($http, localStorageService) {

    'use strict'

    function generateOpts(callback) {

      var opts = {};

      opts.name = localStorageService.get('otSession').name;
      opts.sessionId = localStorageService.get('otSession')._id;
      opts.createdBy = localStorageService.get('otSession').createdBy;
      opts.sessionStart = localStorageService.get('otSession').startsAtMsUtc;
      opts.longUrl = localStorageService.get('videoUrl');

      var sessions = localStorageService.get('sessions');

      var targetId = opts.sessionId;

      _.find(sessions, function(sesssion) {
        var isMatch = (sesssion._id === targetId);
        if (isMatch) {
          return opts.users = sesssion.users
        }
      });
      callback(opts);
    }

    function createArchive(params) {
      var request = $http({
        method: 'POST',
        url: '/archive/',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/archive/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    };

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      generateOpts: generateOpts,
      createArchive: createArchive,
      getAll: getAll
    });
    ArchiveService.$inject('$http', 'localStorageService');
  });


angular.module('RoomBaby')
  .factory('ConstantService', function() {

    'use strict'

    function generateOpts(type) {
      if (type === 'layout') {
        var opts = {
          Animator: {
            duration: 500,
            easing: 'swing'
          },
          bigFixedRatio: false
        };
      }
      return opts;
    }

    function generateError(type) {
      if (type === 'invalidDate') {
        return 'you cannot schedule a room for a date in the past';
      } else if (type === 'invalidUserName') {
        return 'invalid username';
      } else if (type === 'invalidEmail') {
        return 'invalid email';
      } else if (type === 'invalidPassword') {
        return 'invalid password';
      } else if (type === 'invalidTitle') {
        return 'please enter a valid room title, between three and twenty six characters';
      } else if (type === 'dateReset') {
        return 'please select a start date and start time for this room';
      }
    }

    return ({
      generateOpts: generateOpts,
      generateError: generateError
    });
  });


angular.module('RoomBaby')
  .factory('DeviceService', function() {

    'use strict'

    function isMobile() {
       return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4));
    }

    return ({
      isMobile: isMobile
    });
  });


angular.module('RoomBaby')
  .factory('FacebookService', function(localStorageService) {

    'use strict'

    function generateHref(isBroadcast) {
      if (!isBroadcast) {
        var partnerId = localStorageService.get('archive').partnerId;
        var archiveId = localStorageService.get('archive').id;
        return 'https://roombaby-api.herokuapp.com/embed/' + partnerId + '/' + archiveId;
      } else {
        return localStorageService.get('broadcast').longUrl;
      }
    }

    function openShareDialog(href, isBroadcast) {
      if (!isBroadcast) {
        FB.ui({
          method: 'share',
          href: href
        }, function(response) {
          return;
        });
      } else {
        console.log(href);

        FB.ui({
          method: 'feed',
          link: href,
          picture: 'https://raw.githubusercontent.com/scottjason/room-baby-api/master/views/img/rb-embed-735-350.png',
          name: "Room Baby Broadcast",
          description: "The description who will be displayed"
        }, function(response) {
          console.log(response);
        });
      }
    }

    return ({
      generateHref: generateHref,
      openShareDialog: openShareDialog
    });
    FacebookService.$inject('localStorageService');
  });


angular.module('RoomBaby')
  .factory('GeoLocator', function() {

    'use strict'

    var obj = {};

    function get(callback) {
      obj.callback = callback
      if (navigator.geolocation && typeof(navigator.geolocation.getCurrentPosition) == 'function') {
        navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
          maximumAge: 75000
        });
      }
    }

    function reverseGeo(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          for (var i = 0; i < results.length; i++) {
            if (results[i].types[0] === 'locality') {
              var city = results[i].address_components[0].long_name;
              var state = results[i].address_components[2].short_name;
              var location = (city + ', ' + state).toString();
              obj.callback(location);
            }
          }
        }
      }
    }

    function onGeoSuccess(position) {
      var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var coder = new google.maps.Geocoder();
      coder.geocode({
        'latLng': latLng
      }, reverseGeo);
    }

    function onGeoError(err) {
      obj.callback(err);
    }

    return ({
      get: get
    });
  });


angular.module('RoomBaby')
  .factory('PubSub', function() {

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


angular.module('RoomBaby')
  .factory('SessionApi', function($http) {

    'use strict'

    function createRoom(params) {
      var request = $http({
        method: 'POST',
        url: '/session/create-room',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function deleteRoom(session_id, user_id) {
      console.log('deleteRoom called');
      var request = $http({
        method: 'DELETE',
        url: '/session/' + session_id + '/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/session/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function upload(file, user_id, session_id) {
      var formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user_id);
      formData.append('session_id', session_id);
      var request = $http({
        method: 'POST',
        url: '/session/upload',
        data: formData,
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      });
      return (request.then(successHandler, errorHandler));
    }

    function createBroadcast(user) {
      var request = $http({
        method: 'GET',
        url: '/session/create-broadcast/' + user._id
      });
      return (request.then(successHandler, errorHandler));
    };

    function getBroadcast(broadcast_id) {
      console.log('broadcast_id', broadcast_id);
      var request = $http({
        method: 'GET',
        url: '/session/get-broadcast/' + broadcast_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function startRecording(otSessionId) {
      var request = $http({
        method: 'GET',
        url: '/session/record/' + otSessionId
      });
      return (request.then(successHandler, errorHandler));
    }

    function stopRecording(archiveId) {
      var request = $http({
        method: 'GET',
        url: '/session/stop/' + archiveId
      });
      return (request.then(successHandler, errorHandler));
    }

    function getVideoStatus(archiveId) {
      var request = $http({
        method: 'GET',
        url: '/session/video-status/' + archiveId
      });
      return (request.then(successHandler, errorHandler));
    }

    function generateVideoEmbed(params) {
      var request = $http({
        method: 'POST',
        url: '/session/embed',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function generateBroadcastUrl(broadcastId) {
      return 'https://roombaby-api.herokuapp.com/' + broadcastId;
    }

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      createRoom: createRoom,
      deleteRoom: deleteRoom,
      getAll: getAll,
      upload: upload,
      createBroadcast: createBroadcast,
      generateBroadcastUrl: generateBroadcastUrl,
      getBroadcast: getBroadcast,
      startRecording: startRecording,
      stopRecording: stopRecording,
      getVideoStatus: getVideoStatus,
      generateVideoEmbed: generateVideoEmbed
    });
    SessionApi.$inject('$http');
  });


angular.module('RoomBaby')
  .factory('StateService', function() {

    'use strict'

    var stateData = {
      'Animator': {
        'landing': {
          'hasAnimated': false
        },
        'login': {
          'hasAnimated': false
        },
        'register': {
          'hasAnimated': false
        }
      },
      'landing': {
        'members': {
          'isOpen': false
        }
      },
      'overlay': {
        'isOpen': false
      },
      'createRoom': {
        'name': {
          'isValid': false,
          'isPristine': true,
          'text': ''
        },
        'guestEmail': {
          'isValid': false,
          'isPristine': true,
          'text': ''
        },
        'startDate': {
          'isValid': false,
          'localUtc': {},
          'localFormatted': {}
        },
        'formData': {
          'isValid': false
        },
        'isOnload': true
      },
      'Session': {
        'table': []
      },
      'Dashboard': {
        'options': {
          'connect': false
        },
        'isOnLoad': true
      },
      'Auth': {
        'isFacebook': false,
        'Registration': {
          'inProgress': false
        },
        'Login': {
          'inProgress': false
        },
        'ForgotPassword': {
          'isEnterBtn': false
        }
      },
      'Facebook': {
        'shareDialog': {
          'isOpen': false
        }
      },
      'Controllers': {
        'Footer': {
          'isReady': false
        },
        'Landing': {
          'isReady': false
        },
        'Dashboard': {
          'isReady': false
        },
        'Session': {
          'isReady': false
        },
        'Navbar': {
          'isReady': false
        }
      }
    };

    return ({
      data: stateData,
    });
  });


angular.module('RoomBaby')
  .factory('Transport', function(localStorageService) {

    'use strict'

    var now = moment(new Date()).calendar();

    function generateHtml(obj, callback) {
      var type = obj.type;
      switch (type) {
        case 'onConnected':
          onConnected(obj.connectedWith, obj.sessionStartedAt, callback);
          break;
        case 'chatMessage':
          chatMessage(obj.sentBy, obj.message, obj.profileImage, obj.timeSent, callback);
          break;
        case 'shareFile':
          shareFile(obj.sentBy, obj.fileUrl, obj.timeSent, callback);
          break;
        case 'shareVideo':
          shareVideo(obj.videoUrl, callback);
          break;
        case 'sendReceipt':
          sendReceipt(obj.receiptType, obj.isGranted || null, callback);
          break;
        case 'requestPermission':
          requestPermission(obj.requestedBy, callback);
          break;
        default:
          console.error('No case found for ', type);
      }
    }

    function onConnected(connectedWith, sessionStartedAt, callback) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Session Started ' + sessionStartedAt + '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + connectedWith.capitalize() + ' Is Now Connected </p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function chatMessage(userName, userMessage, profileImage, timeSent, callback) {
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<a class="pull-left" href="">' +
        '<img class="media-object img-circle" src=' + profileImage + ' alt="">' +
        '</a>' +
        '<div class="media-body">' +
        '<h4 class="media-heading sent-by">' +
        userName.capitalize() + ' @ ' +
        '<span>' + timeSent + '</span>' +
        '</h4>' +
        '<p class="chat-text">' + userMessage + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function shareFile(sentBy, fileUrl, timeSent, callback) {
      var downloadLink = "<a class='download-link' href=" + fileUrl + " target='_blank'>Click to Download</a>";
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started">' + sentBy.capitalize() + ' Has Shared A File' +
        '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + downloadLink + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function shareVideo(videoUrl, callback) {
      var downloadLink = "<a class='download-link' href=" + videoUrl + " target='_blank'>Click to Download</a>";
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started">Video Ready. Click to Download.' +
        '</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;' + downloadLink + '</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function sendReceipt(receiptType, isGranted, callback) {
      if (receiptType === 'shareFile') {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Room Baby Confirmation</span>' +
          '</h4>' +
          '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp; Your File Has Been Successfully Shared' + '</p>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      } else if (receiptType === 'permissionResponse' && isGranted) {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Request To Record Granted</span>' +
          '</h4>' +
          '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp; Recording Started' + '</p>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      } else if (receiptType === 'permissionResponse' && !isGranted) {
        var html = '<div class="row">' +
          '<div class="col-lg-12">' +
          '<div class="media">' +
          '<div class="media-body">' +
          '<h4 class="media-heading">' +
          '<span class="session-started"> Request To Record Was Not Granted</span>' +
          '</h4>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<hr>' +
          '</div>';
      }
      callback(html);
    }

    function requestPermission(obj, callback) {
      console.log('obj', obj)
      var html = '<div class="row">' +
        '<div class="col-lg-12">' +
        '<div class="media">' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' +
        '<span class="session-started"> Room Baby Notice</span>' +
        '</h4>' +
        '<p class="connected-with"><i class="fa fa-child"></i>' + '&nbsp;Would Like To Record This Session' + '</p>' +
        '<p class="recording-permission">Is this ok?' +
        '</p>' +
        '<ul class="permision-copy-container">' +
        '<li class="permission-granted" id="{{ obj.permissionGranted + "-isGranted" }}">Yes!' +
        '</li>' +
        '<li class="permission-denied" id="{{ obj.permissionDenined + "-isDenied" }}">&nbsp;&nbsp; No Thanks!' +
        '</li>' +
        '<li id="confirm">OK!' +
        '</li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<hr>' +
        '</div>';
      callback(html);
    }

    function generateMessage(user, callback) {
      var obj = {};
      obj.sentBy = user.username;
      obj.message = user.message;
      obj.profileImage = user.profileImage;
      var timeSent = angular.copy(now);
      timeSent = timeSent.split(' ');
      timeSent.splice(0, 2);
      timeSent = timeSent.join(' ');
      obj.timeSent = timeSent;
      var chatMessage = JSON.stringify(obj);
      callback(chatMessage);
    }

    function generateOpts(type, data) {
      var opts = {};
      opts.type = type;
      if (type === 'onConnected') {
        opts.connectedWith = data;
        opts.sessionStartedAt = angular.copy(now);
        localStorageService.set('connectedWith', opts.connectedWith);
        localStorageService.set('sessionStartedAt', opts.sessionStartedAt);
      } else if (type === 'chatMessage') {
        var data = JSON.parse(data);
        opts.sentBy = data.sentBy;
        opts.message = data.message;
        opts.profileImage = data.profileImage;
        opts.timeSent = data.timeSent;
      } else if (type === 'sendReceipt') {
        opts.receiptType = 'permissionResponse';
        opts.isGranted = data.indexOf('granted') !== -1;
      } else if (type === 'requestPermission') {
        opts.requestedBy = data;
      } else if (type === 'shareVideo') {
        opts.videoUrl = data;
      }
      return opts;
    }

    function scroll(direction) {
      if (direction === 'down') {
        var container = document.getElementById('transport-container');
        container.scrollTop = container.scrollHeight;
      }
    }

    return ({
      generateHtml: generateHtml,
      generateMessage: generateMessage,
      generateOpts: generateOpts,
      scroll: scroll
    });
    Transport.$inject('localStorageService');
  });


angular.module('RoomBaby')
  .factory('UserApi', function($http) {

    'use strict'

    function login(params) {
      var request = $http({
        method: 'POST',
        url: '/user/login',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function register(params) {
      var request = $http({
        method: 'POST',
        url: '/user/register',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function saveUserName(params) {
      var request = $http({
        method: 'POST',
        url: 'user/save-user-name',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function cancelAcct(userId) {
      var request = $http({
        method: 'GET',
        url: 'user/cancel-acct/' + userId
      });
      return (request.then(successHandler, errorHandler));
    }

    function upload(params) {
      var request = $http({
        method: 'POST',
        url: 'user/upload-profile-img',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function upload(file, user_id) {
      var formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user_id);
      var request = $http({
        method: 'POST',
        url: '/user/upload',
        data: formData,
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      });
      return (request.then(successHandler, errorHandler));
    }

    function logout(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/logout/' + user_id
      });
      return (request.then(successHandler, errorHandler));
    }

    function update(params) {
      var request = $http({
        method: 'POST',
        url: '/user/update',
        data: params
      });
      return (request.then(successHandler, errorHandler));
    }

    function getAll(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/get-all/' + user_id
      })
      return (request.then(successHandler, errorHandler));
    }

    function getOne(user_id) {
      var request = $http({
        method: 'GET',
        url: '/user/get-one/' + user_id
      })
      return (request.then(successHandler, errorHandler));
    }

    function resetPassword(params) {
      var request = $http({
        method: 'POST',
        url: '/user/reset',
        data: params
      })
      return (request.then(successHandler, errorHandler));
    }

    function isAuthenticated() {
      var request = $http({
        method: 'POST',
        url: '/user/authenticate'
      })
      return (request.then(successHandler, errorHandler));
    }

    function postToFacebook(params) {
      console.log('posting to facebook');
      var request = $http({
        method: 'POST',
        url: '/user/facebook-post',
        data: params
      })
      return (request.then(successHandler, errorHandler));
    }

    function generateOpts(user) {
      var userId = user._id;
      var opts = {
        user_id: userId
      };
      return opts;
    }

    function successHandler(response) {
      return (response);
    }

    function errorHandler(response) {
      return (response);
    }

    return ({
      login: login,
      logout: logout,
      register: register,
      update: update,
      getOne: getOne,
      getAll: getAll,
      upload: upload,
      cancelAcct: cancelAcct,
      saveUserName: saveUserName,
      resetPassword: resetPassword,
      isAuthenticated: isAuthenticated,
      postToFacebook: postToFacebook,
      generateOpts: generateOpts
    });
    UserApi.$inject('$http');
  });


angular.module('RoomBaby')
  .factory('Validator', function(ConstantService) {

    var invalidUserName = ConstantService.generateError('invalidUserName');
    var invalidEmail = ConstantService.generateError('invalidEmail');
    var invalidPassword = ConstantService.generateError('invalidPassword');
    var invalidTitle = ConstantService.generateError('invalidTitle');
    var dateReset = ConstantService.generateError('dateReset');

    var userNameRegEx = /^([a-zA-Z0-9_-]){3,8}$/;
    var emailRegEx = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    function validate(obj, callback) {
      if (obj.type === 'login') {
        validateLogin(obj, callback);
      } else if (obj.type === 'register') {
        validateRegistration(obj, callback);
      } else if (obj.type === 'email') {
        validateEmail(obj.email, callback);
      } else if (obj.type === 'username') {
        validateUserName(obj, callback);
      }
    }

    function validateUserName(obj, cb) {
      if (obj.username.length >= 3 && obj.username.length <= 8) {
        cb(true);
      } else {
        cb(false);
      }
    }

    function validateEmail(guestEmail, callback) {
      var isValidEmail = emailRegEx.test(guestEmail);
      if (!isValidEmail) return callback(null);
      callback(true);
    }

    function validateLogin(obj, callback) {
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));
      if (!validEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!validPassword) {
        callback(null, 'password', invalidPassword);
      } else {
        callback(true, null, null);
      }
    }

    function validateRegistration(obj, callback) {
      var validUserName = userNameRegEx.test(obj.username);
      var validEmail = emailRegEx.test(obj.email);
      var validPassword = (obj.password && (obj.password.length >= 3) && (obj.password.length <= 50));

      if (!validUserName) {
        callback(null, 'username', invalidUserName);
      } else if (!validEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!validPassword) {
        callback(null, 'password', invalidPassword);
      } else {
        callback(true, null, null);
      }
    }

    function validateInvite(obj, callback) {
      var isValidTitle = ((obj.title.length >= 3) && (obj.title.length <= 26));
      var isValidEmail = emailRegEx.test(obj.guestEmail);
      var isValidDate = (obj.startsAt.length);

      if (!isValidTitle) {
        callback(null, 'title', invalidTitle);
      } else if (!isValidEmail) {
        callback(null, 'email', invalidEmail);
      } else if (!isValidDate) {
        callback(null, 'date', invalidDate);
      } else {
        callback(true, null, null);
      }
    }

    function generateOpts(type, data) {
      var opts = {};
      if (type === 'email') {
        opts.type = type;
        opts.email = data;
      } else if (type === 'register' || type === 'login') {
        opts = data;
        opts.type = type;
      }
      return opts;
    }

    return {
      validate: validate,
      generateOpts: generateOpts
    };
    Validator.$inject('ConstantService');
  });


angular.module('RoomBaby')
  .factory('Animator', function() {

    'use strict'

    function run(obj, cb) {
      var type = obj.type;
      if (type === 'onLanding') {
        onLanding(obj.hasAnimated);
      } else if (type === 'onDashboard') {
        onDashboard();
      } else if (type === 'onRegister') {
        onRegister();
      } else if (type === 'onLogin') {
        onLogin();
      } else if (type === 'onFooter') {
        onFooter();
      } else if (type === 'onCreateRoom') {
        onCreateRoom();
      }else if (type === 'onOverlayExit') {
        onOverlayExit();
      } else if (type === 'onFooterOverlay') {
        onFooterOverlay(obj.callback);
      } else if (type === 'onRenderLoading'){
        onRenderLoading(obj.props);
      } else if (type === 'onShowCalendar') {
        onShowCalendar(cb);
      } else if (type === 'onRenderConfirmation') {
        onRenderConfirmation(cb);
      } else if (type === 'onHowThisWorks') {
        onHowThisWorks(cb);
      }
    }

    function onLanding(hasAnimated) {
      var roomBaby = angular.element(document.getElementById('room-baby'));
      var opts;
      if (!hasAnimated) opts = { duration: 600, delay: 50 };
      if (!opts) {
        document.getElementById('room-baby').style.opacity = 1;
        return;
      };

      roomBaby.velocity('transition.slideDownIn', opts);
    }

    function onDashboard() {
      var optsContainer = angular.element(document.getElementById('opts-container'));
      var createRoomBtn = angular.element(document.getElementById('create-room-btn'));
      var createBroadcastBtn = angular.element(document.getElementById('create-broadcast-btn'));
      var sequence = [
        { e: optsContainer, p: { translateZ: 0, translateY: '140px' }, o: { duration: 700, display: 'block' } }, 
        { e: createRoomBtn, p: { opacity: 1 }, o: { duration: 300 } },
        { e: createBroadcastBtn, p: { opacity: 1 }, o: { duration: 300 } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onRegister() {
      var registerCopy = angular.element(document.getElementById('register-copy'));
      var opts = { duration: 700, delay: 50 };
      registerCopy.velocity('transition.slideUpIn', opts);
    }

    function onLogin() {
      var needAcct = angular.element(document.getElementById('need-account'));
      var forgotPassword = angular.element(document.getElementById('forgot-password'));
      var rememberMe = angular.element(document.getElementById('remember-me'));
      var sequence = [
        { e: needAcct, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block' } }, 
        { e: forgotPassword, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block', sequenceQueue: false } }, 
        { e: rememberMe, p: 'transition.slideUpIn', o: { duration: 700, display: 'inline-block', sequenceQueue: false } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onFooter() {
      var footerBtns = angular.element(document.getElementById('footer-btns'));
      var opts = { visibility: 'visible', display: 'inline-flex', duration: 750, delay: 500 };
      footerBtns.velocity("transition.slideUpIn", opts);
    }

    function onCreateRoom() {
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
          dashboardOverlay.velocity({ height: 344 })
      var dashboardContainer = angular.element(document.getElementById('dashboard-container'));
      var dashboardTable = angular.element(document.getElementById('dashboard-table'));
      var noSessionsContainer = angular.element(document.getElementById('no-session-container'));

      var sequence = [
        { e: dashboardContainer, p: 'fadeOut', o: { duration: 200, opacity: 0 } }, 
        { e: dashboardTable, p: 'fadeOut', o: { duration: 200,  opacity: 0, sequenceQueue: false } },
        { e: dashboardOverlay, p: 'fadeIn', o: { duration: 350, delay: 100,  opacity: 1, sequenceQueue: true } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onOverlayExit() {
      var dashboardContainer = angular.element(document.getElementById('dashboard-container'));
      var dashboardTable = angular.element(document.getElementById('dashboard-table'));
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      var sequence = [
        { e: dashboardOverlay, p: 'fadeOut', o: { duration: 0, opacity: 0 } }, 
        { e: dashboardContainer, p: 'fadeIn', o: { duration: 350,  opacity: 1, delay: 100, sequenceQueue: true } },
        { e: dashboardTable, p: 'fadeIn', o: { duration: 100, opacity: 1, sequenceQueue: false } }
      ];
      $.Velocity.RunSequence(sequence);
    }

    function onFooterOverlay(cb) {
      var footerOverlay = angular.element(document.getElementById('footer-overlay'));
      var footerBtnContainer = angular.element(document.getElementById('footer-btn-container'));
      var sequence = [
        { e: footerOverlay, p: 'transition.slideUpIn', o: { duration: 800, delay: 200, display: 'block' } },
        { e: footerBtnContainer, p: 'transition.slideUpIn', o: { duration: 800, delay: 10,  display: 'block' } } 
      ];
      $.Velocity.RunSequence(sequence);
      cb();
    }

    function onRenderLoading(props) {
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      dashboardOverlay.velocity(props);
    }

    function onShowCalendar(cb) {
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      dashboardOverlay.velocity({ height: 619 })
      cb();
    }

    function onRenderConfirmation(cb) {
      var dashboardOverlay = angular.element(document.getElementById('dashboard-overlay'));
      dashboardOverlay.velocity({ height: 619 })
      cb();
    }

    function onHowThisWorks(cb) {
      var workSubtitle = angular.element(document.getElementById('work-subtitle')); 
      var opts = { duration: 750, delay: 500 };
      workSubtitle.velocity("transition.slideLeftIn", opts);
      cb();
    }

    function generateOpts(type, hasAnimated) {
      var opts = {};
      opts.type = type;
      if (type === 'onRenderLoading') {
        opts.props = {
          height: "300px"
        }
      } else if (type === 'onLanding') {
        opts.hasAnimated = hasAnimated;
      }
      return opts;
    }

    return ({
      run: run,
      generateOpts: generateOpts
    });
  });


angular.module('RoomBaby')
  .service('TimeService', function($state, $timeout, SessionApi, PubSub, localStorageService) {

    'use strict'

    var oneMinuteInMs = 60000;
    var monthToIndex = {
      'Jan': 0,
      'Feb': 1,
      'Mar': 2,
      'Apr': 3,
      'May': 4,
      'Jun': 5,
      'Jul': 6,
      'Aug': 7,
      'Sep': 8,
      'Oct': 9,
      'Nov': 10,
      'Dec': 11
    };

    function checkExpiration() {
      var sessions = localStorageService.get('sessions');
      var user = localStorageService.get('user');
      var foundExpiredSession = null;
      if (sessions && sessions.length) {
        for (var i = 0; i < sessions.length; i++) {
          var currentMsUtc = new Date().getTime();
          var expiresAtMsUtc = sessions[i].expiresAt;
          var isExpired = (expiresAtMsUtc - currentMsUtc <= 0);
          if (isExpired) {
            foundExpiredSession = true;
            deleteSession(sessions[i]._id, user._id);
            break;
          }
        }
        if (!foundExpiredSession && $state.current.name === 'dashboard') {
          $timeout(checkExpiration, 500);
        }
      } else if ($state.current.name === 'dashboard') {
        $timeout(checkExpiration, 500);
      }
    }

    function deleteSession(sessionId, userId) {
      var sessions;
      SessionApi.deleteRoom(sessionId, userId).then(function(response) {
        console.log('response', response);
        (response.data && response.data.sessions) ? (sessions = response.data.sessions) : (sessions = null);
        localStorageService.set('sessions', sessions);
        if ($state.current.name === 'dashboard') {
          PubSub.trigger('renderTable');
        }
        checkExpiration();
      }, function(err) {
        console.error(err);
      });
    }

    function getReadyStatus(startTimeMsUtc) {
      var currentMsUtc = new Date().getTime();
      var diffInMs = (startTimeMsUtc - currentMsUtc);
      var isReady = (diffInMs <= oneMinuteInMs);
      return isReady;
    }

    function isExpired(expiresAtMsUtc, callback) {
      var currentMsUtc = new Date().getTime();
      var msLeft = (expiresAtMsUtc - currentMsUtc);
      var isExpired = (msLeft <= 0);
      var secondsLeft = (msLeft / 1000);
      var thirtySecondsLeft = (secondsLeft <= 30);
      var twentySecondsLeft = (secondsLeft <= 20);
      callback(isExpired, msLeft, thirtySecondsLeft, twentySecondsLeft);
    }

    function sortByStartsAt(arr) {
      return _.sortBy(arr, function(obj) {
        return obj.startsAtMsUtc;
      });
    }

    function formatMonth(month) {
      switch (month) {
        case 'Jan':
          return 'January';
          break;
        case 'Feb':
          return 'February';
          break;
        case 'Mar':
          return 'March'
          break;
        case 'Apr':
          return 'April'
          break;
        case 'May':
          return 'May'
          break;
        case 'Jun':
          return 'June'
          break;
        case 'Jul':
          return 'July'
          break;
        case 'Aug':
          return 'August'
          break;
        case 'Sep':
          return 'September'
          break;
        case 'Oct':
          return 'October'
          break;
        case 'Nov':
          return 'November'
          break;
        case 'Dec':
          return 'December'
          break;
        default:
          console.error('no case found on formatMonth', month);
      }
    }

    function generateDetails(obj, isArchive, callback) {
      if (!isArchive) {
        var startsAt = obj.startsAtFormatted;
        obj.details = 'Starts On ' + startsAt;
        callback(obj);
      } else {
        obj.details = shortUrl;
        callback(obj);
      }
    }

    function getStatus(sessions, callback) {

      var isSessionReady;

      _.each(sessions, function(session) {
        if (session.status !== 'ready') {

          var startsAtMsUtc = session.startsAtMsUtc;
          var isReady = getReadyStatus(startsAtMsUtc);

          if (isReady) {
            session.status = 'ready';
            session.options = 'connect';
            isSessionReady = true;
          }
        }
      });
      callback(isSessionReady, sessions);
    }

    function generateTable(sessions, archives, callback) {

      var arr = [];
      var sortedArr = [];
      var _this = this;

      if (sessions && sessions.length) {
        sessions.forEach(function(session) {
          var obj = {};
          obj._id = session._id;
          obj.sessionId = session.sessionId;
          obj.key = session.key;
          obj.secret = session.secret;
          obj.token = session.token
          obj.name = session.name;
          obj.createdBy = 'created by ' + session.createdBy.username;

          obj.startsAtMsUtc = session.startsAt;
          obj.expiresAtMsUtc = session.expiresAt;

          obj.startsAtLocal = new Date(obj.startsAtMsUtc);
          obj.expiresAtLocal = new Date(obj.expiresAtMsUtc);

          obj.startsAtFormatted = moment(angular.copy(obj.startsAtLocal)).format("ddd, MMMM Do YYYY, h:mm a");
          obj.expiresAtFormatted = moment(angular.copy(obj.expiresAtLocal)).format("ddd, MMMM Do YYYY, h:mm a");

          session.users.forEach(function(invitedUser, index) {
            if (index === (session.users.length - 1)) {
              obj.members = (obj.members || '') + invitedUser.email;
            } else {
              obj.members = (obj.members || '') + invitedUser.email + ', ';
            }
          });

          var isReady = getReadyStatus(obj.startsAtMsUtc);

          if (isReady) {
            obj.status = 'ready';
            obj.options = 'connect';
          } else {
            obj.status = 'scheduled'
            obj.options = 'details';
            generateDetails(obj, null, function(object) {
              obj = object;
            });
          }
          arr.push(obj);
        });
        sortedArr = sortByStartsAt(arr);
      }

      if (archives && archives.length) {
        archives.forEach(function(archive) {
          console.log(archive)
          var obj = {};
          obj.name = archive.name;
          obj.createdBy = archive.createdBy;
          archive.users.forEach(function(invitedUser, index) {
            if (index === (archive.users.length - 1)) {
              obj.members = (obj.members || '') + invitedUser.email;
            } else {
              obj.members = (obj.members || '') + invitedUser.email + ', ';
            }
          });
          obj.status = 'archived';
          obj.options = 'video url';
          obj.details = archive.shortUrl;
          sortedArr.push(obj);
        });
      }
      callback(sortedArr);
    }

    function generateTimeLeft(msLeft) {
      var secondsLeft = (msLeft / 1000);
      var minutesLeft = (secondsLeft / 60);
      secondsLeft = secondsLeft % 60;
      var timeLeft = Math.floor(minutesLeft) + ' minutes and ' + Math.floor(secondsLeft) + ' seconds left';
      return timeLeft;
    }

    function formatUpDate(upDate) {
      var arr = upDate.split('-');
      var year = arr[0];
      var month = arr[1];
      month = formatMonth(month);
      var formattedUpDate = (month + ' ' + year);
      return formattedUpDate;
    }

    function isValid(obj, cb) {
      var currentMsUtc = new Date().getTime();
      if (obj.isStartTime) {
        var startsAtMsUtc = obj.startsAt;
        var isValid = (startsAtMsUtc >= currentMsUtc);
        if (isValid) {
          var obj = {};
          obj.localFormatted = moment(new Date(startsAtMsUtc)).format("dddd, MMMM Do YYYY, h:mm a");
          obj.expiresAtMsUtc = addMinutes(startsAtMsUtc, 5);
          cb(isValid, obj);
        } else {
          cb(isValid, null);
        }
      }
    }

    function setStartDate($dates) {
      angular.forEach($dates, function(date, index) {
        var incomingDate = moment.parseZone(date.utcDateValue).format('D MMM YYYY');
        incomingDate = incomingDate.split(' ');

        var incomingDay = parseInt(incomingDate[0]);
        var incomingMonth = monthToIndex[incomingDate[1]];
        var incomingYear = parseInt(incomingDate[2]);

        var today = new Date();
        var currentDay = today.getDate();
        var currentMonth = today.getMonth();
        var currentYear = today.getFullYear();

        var isToday = ((incomingDay === currentDay) && (incomingMonth === currentMonth) && (incomingYear === currentYear));
        isToday ? (date.active = true) : (date.active = false);
      });
    }

    function addMinutes(incomingMsUtc, minsToAdd) {
      var oneMinute = 60000;
      var msToAdd = (oneMinute * minsToAdd);
      var resultInMs = (incomingMsUtc + msToAdd);
      return resultInMs;
    }

    function generateOpts(startsAtMsUtc) {
      var opts = {};
      opts.isStartTime = true;
      opts.startsAt = startsAtMsUtc;
      return opts;
    }

    return ({
      generateTable: generateTable,
      generateOpts: generateOpts,
      generateTimeLeft: generateTimeLeft,
      getStatus: getStatus,
      formatUpDate: formatUpDate,
      isValid: isValid,
      setStartDate: setStartDate,
      addMinutes: addMinutes,
      isExpired: isExpired,
      checkExpiration: checkExpiration
    });
    TimeService.$inject('$state', '$timeout', 'SessionApi', 'PubSub', 'localStorageService')
  });


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


angular.module('RoomBaby')
  .directive('ngInvite', function(Validator, PubSub, StateService) {

    'use strict';

    return {
      restrict: 'A',
      scope: {
        name: '=',
        guestEmail: '=',
        onTimeSet: '=',
      },
      link: function(scope, element, attrs) {
        element.bind('click', function($event) {
          var isCreateRoomNowBtn = ($event.target.id === 'on-create-room-now');
          var isCreateRoomLaterBtn = ($event.target.id === 'on-create-room-later');
          if (isCreateRoomNowBtn || isCreateRoomLaterBtn) {
            isCreateRoomNowBtn ? PubSub.trigger('createRoomOpt', true) : PubSub.trigger('createRoomOpt', null);
          }
          var isSubmitBtn = ($event.target.id === 'on-create-room-submit');
          var isValid = StateService.data['createRoom']['formData'].isValid;
          if (isSubmitBtn && isValid) {
            PubSub.trigger('createRoom:renderConfirmation');
          } else if (isSubmitBtn && !isValid) {
            PubSub.trigger('createRoom:renderMessage', 'createRoomErr', 'please complete all fields');
          }
        });
      },
      controller: ['$scope', function($scope) {

        $scope.$watch('onTimeSet', function() {
          if ($scope.onTimeSet) {
            StateService.data['createRoom']['startDate'].isValid = true;
            var isValidName = StateService.data['createRoom']['name'].isValid;
            var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
            if (isValidName && isValidEmail) {
              StateService.data['createRoom']['formData'].isValid = true;
            }
          } else {
            StateService.data['createRoom']['formData'].isValid = false;
          }
        });

        $scope.$watch('name', function() {
          var isPristine = !$scope.name;
          if (isPristine) {
            StateService.data['createRoom']['name'].isPristine = true;
            StateService.data['createRoom']['formData'].isValid = false;
          } else {
            StateService.data['createRoom']['name'].isPristine = false;
          }

          var isValid = ($scope.name && $scope.name.length >= 3);
          if (isValid) {
            StateService.data['createRoom']['name'].text = $scope.name;
            StateService.data['createRoom']['name'].isValid = true;
            var isValidDate = StateService.data['createRoom']['startDate'].isValid
            var isValidEmail = StateService.data['createRoom']['guestEmail'].isValid;
            if (isValidDate && isValidEmail) {
              StateService.data['createRoom']['formData'].isValid = true;
            }
          } else {
            StateService.data['createRoom']['name'].isValid = false;
            StateService.data['createRoom']['formData'].isValid = false;
          }
        });

        $scope.$watch('guestEmail', function() {
          var isPristine = !$scope.guestEmail;
          if (isPristine) {
            StateService.data['createRoom']['guestEmail'].isPristine = true;
            StateService.data['createRoom']['formData'].isValid = false;
          } else {
            StateService.data['createRoom']['guestEmail'].isPristine = false;
          }

          var opts = {};
          opts.type = 'email';
          opts.email = $scope.guestEmail;

          Validator.validate(opts, function(isValid) {
            if (isValid) {
              var isValidDate = StateService.data['createRoom']['startDate'].isValid
              var isValidName = StateService.data['createRoom']['name'].isValid;
              StateService.data['createRoom']['guestEmail'].text = $scope.name;
              StateService.data['createRoom']['guestEmail'].isValid = true;
              if (isValidDate && isValidName) {
                StateService.data['createRoom']['formData'].isValid = true;
              }
            } else {
              StateService.data['createRoom']['guestEmail'].isValid = false;
              StateService.data['createRoom']['formData'].isValid = false;
            }
          });
        });
      }],
    }
    ngInvite.$inject('Validator, PubSub, StateService')
  });


angular.module('RoomBaby')
  .directive('ngOverlay', function(Animator, Validator, StateService) {
    return function(scope, element, attrs) {
      element.bind('click', function(event) {

        var obj = {};

        var isCreateBtn = (event.target.id === 'create-room-btn');
        var isSubmitBtn = (event.target.id === 'on-create-room-submit');
        var isExitBtn = (event.target.id === 'dash-overlay-exit-btn');
        var isOpen = StateService.data['overlay'].isOpen;

        if (!isOpen && isCreateBtn) {
          obj.type = 'onCreateRoom';
          StateService.data['overlay'].isOpen = true;
          Animator.run(obj);
        } else if (isOpen && isExitBtn && !isSubmitBtn) {
          StateService.data['createRoom']['name'].text = '';
          StateService.data['createRoom']['guestEmail'].text = '';
          StateService.data['createRoom']['name'].isValid = false;
          StateService.data['createRoom']['guestEmail'].isValid = false;
          StateService.data['createRoom']['formData'].isValid = false;
          StateService.data['overlay'].isOpen = false;
          scope.$apply(attrs.clearForm);

          if (scope.showCalendar) {
            scope.showCalendar = false;
            if (!scope.$$phase) {
              scope.$apply();
            }
          }
          obj.type = 'onOverlayExit';
          Animator.run(obj);
        }
      });
    }
    ngOverlay.$inject('Animator, Validator, StateService');
  });


angular.module('RoomBaby')
  .directive('ngUpload', function($parse) {
    return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.ngUpload);
      var modelSetter = model.assign;
      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        })
      })
    }
  };
  ngUpload.$inject('$parse');
});


angular.module('RoomBaby')
  .directive('ngWindow', function($rootScope, $window) {
    return {
      restrict: 'A',

      link: function(scope, element, attrs) {
        scope.onResize = function() {
          var isDisabled = ($window.innerWidth <= 900);
          if (isDisabled) {
            console.log('isDisabled');
            $rootScope.$broadcast('isDisabled');
          } else {
            console.log('isEnabled');
            $rootScope.$broadcast('isEnabled');
          }
        }
        scope.onResize();
        angular.element($window).bind('resize', function() {
          scope.onResize();
        })
      }
    };
    ngWindow.$inject('$rootScope', '$window');
  });


angular.module('RoomBaby')
  .filter('capitalize', function() {

    return function(input, scope) {
      if (input) {
        input = input.toLowerCase();
        return input.substring(0, 1).toUpperCase() + input.substring(1);
      }
    };
  });


angular.module('RoomBaby')
  .filter('trusted', ['$sce', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}]);

