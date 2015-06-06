timelineApp.controller('analyticsController', ['$scope', '$rootScope', '$window', 'moment', 'analyticsService', '$http',

  function($scope, $rootScope, $window, moment, analyticsService, $http) {

    var vm = this;
    
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var lastDayNames = ['lastSunday', 'lastMonday', 'lastTuesday', 'lastWednesday', 'lastThursday', 'lastFriday', 'lastSaturday'];
    var dayOfWeek;    
    
    $scope.master = [];

    $scope.currcategory = 'all';
    $scope.calname = $rootScope.calname;

    $scope.duration = 'daily'
    $scope.graph = 'category'

    $scope.oneWeek = {};
    $scope.twoWeeks = {};

    $scope.monday = {};
    $scope.tuesday = {};
    $scope.wednesday = {};
    $scope.thursday = {};
    $scope.friday = {};
    $scope.saturday = {};
    $scope.sunday = {};

    $scope.lastMonday = {};
    $scope.lastTuesday = {};
    $scope.lastWednesday = {};
    $scope.lastThursday = {};
    $scope.lastFriday = {};
    $scope.lastSaturday = {};
    $scope.lastSunday = {};

    $scope.mostDownloadedThisWeek = [];

    $scope.setDuration = function(duration) {
      $scope.duration = duration;
      // add logic to change chart here
    };

    $scope.selectGraph = function(graph) {
      $scope.graph = graph;
    };

    // top frame analytics
    var getAnalytics = function(data) {
      var url = '/api/analytics';
      return $http.post(url, data);
    };

    var getAnalyticClicks = function(data) {
      var url = '/api/analytics/clicks';
      return $http.post(url, data);
    };

    var analyticsSetup = function(category) {
      var totalData = {
        calendar: $scope.calid,
        total: true
      };

      var numberWithCommas = function(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      var start = new Date();
      var year = start.getFullYear();
      var month = start.getMonth();
      var day = start.getDate();
      var startOfWeek = new Date(start.setDate(start.getDate() - 7));
      var weekData = {
        calendar: $scope.calid,
        total: false,
        start: startOfWeek
      };
      var weeklyClicks = {
        calendar: $scope.calid,
        total: false,
        start: startOfWeek
      };

      if (category) {
        totalData.category = category;
        weekData.category = category;
        weeklyClicks.category = category;
      }

      var total = getAnalytics(totalData);

      total.then(function(res, err) {
        if (err) {
          vm.errorHandler(err);
        } else {
          $scope.totalDownloads = numberWithCommas(res.data.count);
          if ($scope.totalDownloads > 0) {
            $scope.analytics = true;
          } else {
            $scope.analytics = false;
          }
        }
      });
      var week = getAnalytics(weekData);
      var clicks = getAnalyticClicks(weeklyClicks);
      week.then(function(res, err) {
        if (err) {
          console.log(err);
        } else {
          $scope.weeklyDownloads = numberWithCommas(res.data.count);
        }
      })
      clicks.then(function(res, err) {
        if (err) {
          console.log(err);
        } else {
          $scope.weeklyClicks = numberWithCommas(res.data.count);
        }
      })
    };
    analyticsSetup();

    /* 
      Generate start and end moment utc objects for both the one week interval and the 
      two week interval before the api calls & store a reference in $scope 
    */

    analyticsService.generateBounds(function(obj) {
      $scope.oneWeekStartDate = obj.oneWeekAgo;
      $scope.oneWeekEndDate = obj.oneWeekEndDate;
      $scope.twoWeekStartDate = obj.twoWeeksAgo;
      $scope.twoWeekEndDate = obj.oneWeekAgo;

      /* Make the getAll request in the callback and pass in this user's calendar id */
      analyticsService.getAll($scope.calid).then(function(response) {
          if (response.status === 200 && response.data.analytics.length !== 0) {
            vm.successHandler(response.data.analytics, vm.generateHelperObjs);
          } else {
            vm.errorHandler(new Error('unknown response status or response length zero'), response);
          }
        },
        function(err) {
          vm.errorHandler(err);
        }
      );
    });


    vm.successHandler = function(data, callback) {
      for (var i = 0; i < data.length; i++) {
        /* Generate the obj for the current elem, pass in category id, day of year, year, download count & callback */
        analyticsService.generateObj(data[i]._id.category, data[i]._id.dayOfYear, data[i]._id.year, data[i].total, function(obj) {

          /* Check if this download occured last week or two weeks ago, store a boolean */
          var isOneWeek = analyticsService.lastWeek($scope.oneWeekStartDate, $scope.oneWeekEndDate, obj.createdAt);
          var isTwoWeek = analyticsService.twoWeeks($scope.twoWeekStartDate, $scope.twoWeekEndDate, obj.createdAt);

          /* No ternerary here to account for dates that are out of bounds (where both isOneWeek and isTwoWeek are falsey) */
          if (isOneWeek) return vm.pushObj('oneWeek', obj);
          if (isTwoWeek) return vm.pushObj('twoWeek', obj);
        }); /* End Callback */
      } /* End For Loop */
      // callback(vm.renderDownloadsByCategory);
    }; /* End Function */

    vm.pushObj = function(interval, obj) {      
      if(obj.categoryId !== undefined && interval === 'oneWeek') {
        obj.categoryName = 'one week name';
        obj.dayOfWeek = dayNames[obj.createdAt.getDay()];
        $scope.master.push(obj);
      }
      else if (obj.categoryId !== undefined && interval === 'twoWeek') {
        obj.categoryName = 'two week name';
        obj.dayOfWeek = dayNames[obj.createdAt.getDay()];
        $scope.master.push(obj);
      }
      console.log($scope.master);
    };

    vm.generateOrderOfDays = function(dayOne) {
      if (dayOne.indexOf('Mon') > -1) return [$scope.monday, $scope.tuesday, $scope.wednesday, $scope.thursday, $scope.friday, $scope.saturday, $scope.sunday];
      if (dayOne.indexOf('Tue') > -1) return [$scope.tuesday, $scope.wednesday, $scope.thursday, $scope.friday, $scope.saturday, $scope.sunday, $scope.monday];
      if (dayOne.indexOf('Wed') > -1) return [$scope.wednesday, $scope.thursday, $scope.friday, $scope.saturday, $scope.sunday, $scope.monday, $scope.tuesday];
      if (dayOne.indexOf('Thu') > -1) return [$scope.thursday, $scope.friday, $scope.saturday, $scope.sunday, $scope.monday, $scope.tuesday, $scope.wednesday];
      if (dayOne.indexOf('Fri') > -1) return [$scope.friday, $scope.saturday, $scope.sunday, $scope.monday, $scope.tuesday, $scope.wednesday, $scope.thursday];
      if (dayOne.indexOf('Sat') > -1) return [$scope.saturday, $scope.saturday, $scope.monday, $scope.tuesday, $scope.wednesday, $scope.thursday, $scope.friday];
      if (dayOne.indexOf('Sun') > -1) return [$scope.sunday, $scope.monday, $scope.tuesday, $scope.wednesday, $scope.thursday, $scope.friday, $scope.saturday];
    };

    vm.convertObjectsToArrs = function(obj, cb) {
      console.log(obj)
      var arr = [];

      var arrOne = Object.keys(obj.dayOneXAxis).map(function(key) {
        return obj.dayOneXAxis[key]
      });
      var sortedOne = _.sortBy(arrOne, function(num) {
        return Math.sin(num);
      });

      var arrTwo = Object.keys(obj.dayTwoXAxis).map(function(key) {
        return obj.dayTwoXAxis[key]
      });
      var sortedTwo = _.sortBy(arrTwo, function(num) {
        return Math.sin(num);
      });

      var arrThree = Object.keys(obj.dayThreeXAxis).map(function(key) {
        return obj.dayThreeXAxis[key]
      });
      var sortedThree = _.sortBy(arrThree, function(num) {
        return Math.sin(num);
      });

      var arrFour = Object.keys(obj.dayFourXAxis).map(function(key) {
        return obj.dayFourXAxis[key]
      });
      var sortedFour = _.sortBy(arrFour, function(num) {
        return Math.sin(num);
      });

      var arrFive = Object.keys(obj.dayFiveXAxis).map(function(key) {
        return obj.dayFourXAxis[key]
      });
      var sortedFive = _.sortBy(arrFive, function(num) {
        return Math.sin(num);
      });

      var arrSix = Object.keys(obj.daySixXAxis).map(function(key) {
        return obj.dayFourXAxis[key]
      });
      var sortedSix = _.sortBy(arrSix, function(num) {
        return Math.sin(num);
      });

      var arrSeven = Object.keys(obj.daySevenXAxis).map(function(key) {
        return obj.dayFourXAxis[key]
      });
      var sortedSeven = _.sortBy(arrSeven, function(num) {
        return Math.sin(num);
      });

      arr.push(sortedOne, sortedTwo, sortedThree, sortedFour, sortedFive, sortedSix, sortedSeven);

      console.log('234', arr);
      cb(arr);
    };

    vm.downloadsThisWeek = function(obj) { /* Works */
      return analyticsService.totalDownloads('weeklyTotal', obj);
    };

    vm.downloadsLastWeek = function(obj) { /* Works */
      return analyticsService.totalDownloads('weeklyTotal', obj);
    };

    vm.thisWeeksMostDownloaded = function() { /* Works */
      $scope.mostThisWeek = analyticsService.thisWeeksMostDownloaded($scope.oneWeek, $scope.mostDownloadedThisWeek, $scope.downloadsThisWeek);
      return $scope.mostThisWeek;
    };

    vm.downloadsPerDay = function(day) {
      return analyticsService.downloadsPerDay(day); /* Works */
    };
    vm.generateJSON = function(result, days, most, callback) {
      if (most.length === 0) {
        callback(null);
      } else if (most.length === 1) {
        analyticsService.generateJSON(1, result, days, most, callback);
      } else if (most.length === 2) {
        analyticsService.generateJSON(2, result, days, most, callback);
      } else if (most.length === 3) {
        analyticsService.generateJSON(3, result, days, most, callback);
      } else if (most.length >= 4) {
        analyticsService.generateJSON(4, result, days, most, callback);
      }
    };
    // vm.generateHelperObjs = function(callback) {
    //   $scope.mondayTotal = vm.downloadsPerDay($scope.monday);
    //   $scope.tuesdayTotal = vm.downloadsPerDay($scope.tuesday);
    //   $scope.wednesdayTotal = vm.downloadsPerDay($scope.wednesday);
    //   $scope.thursdayTotal = vm.downloadsPerDay($scope.thursday);
    //   $scope.fridayTotal = vm.downloadsPerDay($scope.friday);
    //   $scope.saturdayTotal = vm.downloadsPerDay($scope.saturday);
    //   $scope.sundayTotal = vm.downloadsPerDay($scope.sunday);

    //   $scope.lastMondayTotal = vm.downloadsPerDay($scope.lastMonday);
    //   $scope.lastTuesdayTotal = vm.downloadsPerDay($scope.lastTuesday);
    //   $scope.lastWednesdayTotal = vm.downloadsPerDay($scope.lastWednesday);
    //   $scope.lastThursdayTotal = vm.downloadsPerDay($scope.lastThursday);
    //   $scope.lastFridayTotal = vm.downloadsPerDay($scope.lastFriday);
    //   $scope.lastSaturdayTotal = vm.downloadsPerDay($scope.lastSaturday);
    //   $scope.lastSundayTotal = vm.downloadsPerDay($scope.lastSunday);

    //   $scope.downloadsThisWeek = vm.downloadsThisWeek($scope.oneWeek);

    //   $scope.downloadsLastWeek = vm.downloadsLastWeek($scope.twoWeeks);
    //   $scope.diff = ((($scope.downloadsThisWeek - $scope.downloadsLastWeek) / $scope.downloadsThisWeek) * 100).toFixed(2) + '%';
    //   callback();
    // };

    vm.renderDownloadsByCategory = function() {
      var allDays = [
        moment($scope.oneWeekStartDate).format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(1, 'days').format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(2, 'days').format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(3, 'days').format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(4, 'days').format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(5, 'days').format('ddd, MMM Do'),
        moment($scope.oneWeekStartDate).add(6, 'days').format('ddd, MMM Do')
      ];

      var dynamicWeek = vm.generateOrderOfDays(allDays[0]);

      $scope.mostThisWeek = vm.thisWeeksMostDownloaded();

      var xAxis = {};

      xAxis.dayOneXAxis = dynamicWeek[0];
      xAxis.dayTwoXAxis = dynamicWeek[1];
      xAxis.dayThreeXAxis = dynamicWeek[2];
      xAxis.dayFourXAxis = dynamicWeek[3];
      xAxis.dayFiveXAxis = dynamicWeek[4];
      xAxis.daySixXAxis = dynamicWeek[5];
      xAxis.daySevenXAxis = dynamicWeek[6];

      vm.convertObjectsToArrs(xAxis, function(result) {

        for (var i = 0; i < result.length; i++) {
          if (!result[i].length) {
            result[i] = [0, 0, 0, 0, 0];
          }
        }


        var barOpts = {
          chart: {
            type: 'bar',
            renderTo: 'container'
          },
          title: {
            text: 'Downloads This Week'
          },
          subtitle: {
            text: 'powered by stanza'
          },
          xAxis: {
            min: 0,
            categories: []
          },
          yAxis: {
            min: 0,
            title: {
              text: 'Downloads This Week'
            }
          },
          legend: {
            reversed: true
          },
          plotOptions: {
            series: {
              stacking: 'normal'
            }
          },
          series: []
        }

        var pieDataArr = [];
        pieDataArr.push(
          ['category name', $scope.mostThisWeek[0].total], ['category name', $scope.mostThisWeek[1].total], ['category name', $scope.mostThisWeek[2].total], ['category name', $scope.mostThisWeek[3].total], ['category name', $scope.mostThisWeek[4].total]
        )

        var pieSeries = [{
          data: pieDataArr,
          center: ['50%'],
        }];

        vm.generateJSON(result, allDays, $scope.mostThisWeek, function(json) {
          if (!json) {
            return;
          }

          var barOpts = {
            chart: {
              type: 'bar',
              renderTo: 'container'
            },
            title: {
              text: 'Downloads This Week'
            },
            subtitle: {
              text: 'powered by stanza'
            },
            xAxis: {
              min: 0,
              categories: []
            },
            yAxis: {
              min: 0,
              title: {
                text: 'Downloads This Week'
              }
            },
            legend: {
              reversed: true
            },
            plotOptions: {
              series: {
                stacking: 'normal'
              }
            },
            series: []
          }

          var pieOpts = {
            chart: {
              type: 'pie',
              renderTo: 'containerPie'
            },
            title: {
              text: 'Downloads This Week'
            },
            subtitle: {
              text: 'powered by stanza'
            },
            plotOptions: {
              series: {
                stacking: 'normal'
              }
            },
            series: pieSeries
          }

          barOpts.xAxis.categories = json[0]['data'];

          if (result.length >= 1) {
            barOpts.series[0] = json[1];
          }
          if (result.length >= 2) {
            barOpts.series[1] = json[2];
          }
          if (result.length >= 3) {
            barOpts.series[2] = json[3];
          }
          if (result.length >= 4) {
            barOpts.series[3] = json[4];
          }
          var chartLeft = new Highcharts.Chart(barOpts);
          var chartRight = new Highcharts.Chart(pieOpts);
        });
      });
    }

    vm.errorHandler = function(err) {
      console.error('An Error Occured in Analytics Ctrl GetAll Request');
      if (err.status) console.error('Error Status', err.status);
      if (err.message) console.error('Error Message', err.message);
      if (err.stack) console.error('Error Stack', err.stack);
      if (!err.status && !err.message && !err.stack) console.error('Error Object', err);
    }
  }
])
