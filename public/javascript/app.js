angular.module('app', ['ngTouch','ui.router'])
.directive('calendar', function($http, $swipe){
  return {
    restrict: 'E',
    link: function (scope, elem, attrs) {
      var offset = 100;
      function scrollHandler(e) {
        if ((this.scrollLeft + this.clientWidth + offset) > this.scrollWidth) {
          console.log('load more;')
        }
      }

      function swipeLeftHandler(e) {
        console.log('swipe left?');
      }

      function swipeRightHandler(e) {
        console.log('swipe right?');
      }

      elem.bind('scroll', scrollHandler);
      elem.bind('ng-swipe-left', swipeLeftHandler)
      elem.bind('ng-swipe-right', swipeRightHandler)
    }
  }
})
.directive('day', function($compile, $http){
  return {
    restrict: 'E',
    link: function (scope, elem, attrs) {
      function clickHandler() {
        var add = angular.element('<div class="add" contenteditable="true" ng-blur="destroy()"></div>')
        elem.append(add);
        $compile(add);
        

        save = function(e) {
          if (e.keyCode == 13) {
            //console.log(angular.element(this).html());
            //console.log(scope.day.date.original);
            $this = this;
            data = {date: scope.day.date.original, text: angular.element(this).html()};
            $http.post('/api/data', data).
              success(function(res) {
                //console.log('--- parse result ---');
                //console.log(res);
                scope.day.items.push(res);
                $this.blur();
              });
          } else if (e.keyCode == 27) {
            // ESC was pressed
            this.blur();
          }

        }

        destroy = function(e) {
          //e.preventDefault();
          this.remove();
        }

        add.bind('keydown', save);
        add.bind('blur', destroy);

        //console.log(add[0]);
        add[0].focus();
        //console.log(this);
        //console.log(elem);

      }

      //console.log(scope);
      elem.on('click', clickHandler);
    }
  }
})
.directive('item', function($compile, $http){
  return {
    restrict: 'E',
    link: function (scope, elem, attrs) {
      function editHandler(e) {
        e.stopPropagation();
        console.log('handling edit');
        //elem.html(scope.item.original);
        //console.log(scope);
        //scope.item.type = 'edit';
      }
      elem.bind('click', editHandler);
    }
  }
})
.factory('AuthService', function ($http, Session) {
  return {
    login: function (credentials) {
      var url = '/login';// + (credentials); // password, email_address
      return $http
        .post(url, credentials)
        .then(function (res) {
          Session.create(res.data._id);
          sessionStorage.user = JSON.stringify(res.data);
        });
    },
    isAuthenticated: function () {
      return !!Session.id;
    },
    isAuthorized: function (authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      return (this.isAuthenticated() &&
        authorizedRoles.indexOf(Session.role) !== -1);
    }
  };
})
.service('Session', function () {
  this.create = function (id, role) {
    this.id = id;
    this.role = role || 'user';
  };
  this.destroy = function () {
    this.id = null;
    this.role = null;
  };
  return this;
})
// CONTROLLERS
.controller('MainCtrl', function ($scope, USER_ROLES, AuthService) {
  $scope.currentUser = null;
  $scope.userRoles = USER_ROLES;
  $scope.isAuthorized = AuthService.isAuthorized;
})
.controller('LoginCtrl', function ($scope, $rootScope, AUTH_EVENTS, AuthService, $state) {
  $scope.credentials = {
    email: '',
    password: ''
  };
  $scope.login = function (credentials) {
    AuthService.login(credentials).then(function () {
      $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
      $state.go('app');
    }, function () {
      $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      $scope.error = 'failed and stuff'
    });
  };
})
.controller('CalendarCtrl', function($scope, $http){
  
  $scope.days = null;
  $http.get('/api/data').
    success(function(res){
      console.log(res);
      $scope.days = res;
    });

  $scope.getBackground = function(item) {
    //console.log('-----------');
    //console.log(item);
    //console.log(typeof item.article == 'undefined');
    return (typeof item.article != 'undefined' && typeof item.article.image != 'undefined') ? 'background-image: url("'+item.article.image+'");' : 'background-color:'+item.background+';';
  }

  $scope.getTitle = function(item) {
    return (typeof item.article != 'undefined' && typeof item.article.title != 'undefined') ? item.article.title : item.text;
  }

  $scope.getTemplate = function(template) {
    //console.log(template);
    return '/template/' + template;
  }

  /*$scope.swiped = function(dir) {
    console.log(dir);
  } */

  function convert(day, original) {
    //var regex = /^([0]\d|[1][0-2]):([0-5]\d)\s?(?:AM|PM)$/i;
    var time = [];
    original.replace(/^([0]\d|[1][0-2]):([0-5]\d)\s?(?:AM|PM)$/gi, function($0) { time.push($0); return ''; });
    console.log(time);
    
  }

  /*$scope.focus = function() {
    console.log('focusing...');
  }*/

})
// CONFIG
.config(function($stateProvider, $urlRouterProvider, USER_ROLES) {
  $urlRouterProvider.otherwise('/login')
  //$urlRouterProvider.otherwise("/streams")
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: "views/login",
      controller: 'LoginCtrl'
    })
    .state('app', {
      url: '/app',
      templateUrl: 'views/app',
      controller: 'CalendarCtrl',
      data: {
        authorizedRoles: [USER_ROLES.admin, USER_ROLES.user]
      }
    })
    .state('test', {
      url: '/test',
      templateUrl: 'views/test',
      controller: function($scope) {
        $scope.messages = 'hello ';
      }
    })
})
.run(function ($rootScope, AUTH_EVENTS, AuthService) {
  $rootScope.$on('$stateChangeStart', function (event, next) {
    if (!next.data) return;
    var authorizedRoles = next.data.authorizedRoles;
    if (!AuthService.isAuthorized(authorizedRoles)) {
      event.preventDefault();
      if (AuthService.isAuthenticated()) {
        // user is not allowed
        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
      } else {
        // user is not logged in
        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
      }
    }
  });
})
// CONSTANTS
.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})
.constant('USER_ROLES', {
  all: '*',
  admin: 'admin',
  user: 'user'
});