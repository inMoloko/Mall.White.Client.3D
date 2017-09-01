(function () {
    "use strict";
    var controller = function ($scope, $http, settings, $state, $rootScope, arrayHelper, $q, Idle, $location, $stateParams, $timeout, categoryService, statisticService, dbService, $linq, $indexedDB, dbVersionService) {
        //Обработка простоя
        $scope.$on('IdleTimeout', function () {
            $state.go('navigation', {});

            statisticService.sendStatistics();
            Idle.watch();
        });

        // statisticService.getAll().then(i => {
        //     console.log(i);
        //     i.forEach(j => {
        //         statisticService.delete(j);
        //     });
        // });
        // $indexedDB.openStore('statistics', (store) => {
        //     store.getAll().then(statistics => {
        //         console.log(statistics);
        //         statistics.forEach(st => {
        //             store.delete(st.Date);
        //         });
        //
        //     });
        // });
        //statisticService.sendStatistics();

        //$scope.formatThemesMain = [];
        $rootScope.orientation;

        //$scope.changeOrientation();
        //граф для поиска организаций
        $rootScope.mapGraph = new Graph();

        $scope.change = function () {
            $state.go('navigation.mainMenu', {});
        };

        let graphLayerd = {};
        $rootScope.floorsDic = {};
        dbService.getData().then(data => {

            data.Floors.forEach(function (floor, i, arr) {
                let layer = graphLayerd[floor.FloorID] = $rootScope.mapGraph.addLayer(floor.FloorID);
                floor.Paths.forEach(p => {
                    let x1 = p[0].X * settings.mapScale;
                    let y1 = p[0].Y * settings.mapScale;
                    let x2 = p[1].X * settings.mapScale;
                    let y2 = p[1].Y * settings.mapScale;
                    //layer.addSegment(p[0].x, p[0].y, p[1].x, p[1].y);
                    layer.addSegment(x1, y1, x2, y2);
                    $rootScope.floorsDic[floor.FloorID] = floor;
                });
                if (floor.TerminalMapObject)
                    graphLayerd[floor.FloorID].addVertexWithShortestSegment(floor.TerminalMapObject.Longitude * settings.mapScale, floor.TerminalMapObject.Latitude * settings.mapScale);
            });
            data.Links.forEach(link => {
                var layer1 = graphLayerd[link.MapObjectFrom.FloorID];
                let x = link.MapObjectFrom.Longitude * settings.mapScale;
                let y = link.MapObjectFrom.Latitude * settings.mapScale;
                let vertex1 = layer1.getVertex(x, y) || layer1.addVertexWithShortestSegment(x, y).vertex;

                let layer2 = graphLayerd[link.MapObjectTo.FloorID];
                x = link.MapObjectTo.Longitude * settings.mapScale;
                y = link.MapObjectTo.Latitude * settings.mapScale;

                let vertex2 = layer2.getVertex(x, y) || layer2.addVertexWithShortestSegment(x, y).vertex;
                if (vertex1 && vertex2) {
                    let segment1 = layer1.addSegment1(vertex1, vertex2);
                    layer2.addSegment1(vertex1, vertex2);
                }
            });
            $rootScope.anchorOrganizations = $linq.Enumerable().From(data.Organizations).Select(i => i.Value).Where(o => o.IsAnchor == 1 && o.Schedule != null).ToArray();
            $rootScope.anchorOrganizations.forEach(i => {
                try {
                    var schedule = JSON.parse(i.Schedule);

                    var listPeriod = [];
                    schedule.forEach(s => {
                        if (s.isUse != true) {
                            var period = {};
                            period.fromTime = s.From;
                            period.toTime = s.To;
                            period.listDays = [];
                            schedule.forEach(ss => {
                                if (ss.From == s.From && ss.To == s.To) {
                                    period.listDays.push({num: schedule.indexOf(ss), day: ss.Name});
                                    ss.isUse = true;
                                }
                            });
                            listPeriod.push(period);
                        }
                    });

                    listPeriod.sort(function (a, b) {
                        return b.listDays.length > 3;
                    });
                    i.displaySchedule = [];
                    listPeriod.forEach(lp => {
                        i.displaySchedule.push($scope.getDisplaySchedule(lp));
                    });
                }
                catch (exc) {
                    console.error('Ошибка формирования расписания');
                }
            });
            $rootScope.anchorOrganizations = $rootScope.anchorOrganizations.filter(a => a.displaySchedule != undefined);
        });


        $rootScope.$on('$stateChangeSuccess',
            function (event, toState, toParams, fromState, fromParams) {
                //console.log(fromState, toState);
                //Начальное состояние ничего не выбранно
                if (toState.name === 'navigation.mainMenu') {
                    $rootScope.currentOrganizations = undefined;
                    $rootScope.currentOrganization = undefined;
                }
                if (toState.name.endsWith('shop') || toState.name.endsWith('restaurant') || toState.name.endsWith('service')) {
                    statisticService.addStatistic({
                        Action: 'SelectОрганизацияСхема',
                        ParamsAsJson: {OrganizationID: $state.params.OrganizationID},
                        Date: new Date()
                    });
                }
                else {
                    statisticService.addStatistic({
                        Action: 'Command',
                        ParamsAsJson: {
                            url: $location.url()
                        },
                        Date: new Date()
                    });
                }
            });
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
            console.log('');
        });

        $rootScope.scrollConfig = {
            autoHideScrollbar: false,
            theme: 'minimal-dark',
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            },
            setHeight: false,
            scrollInertia: 0
        };
        let x, y;

        //время работы якорей
        $rootScope.anchorOrganizations;

        $scope.showAnchorOrganization = function (item) {
            $state.go('navigation.organization', {
                OrganizationID: item.OrganizationID,
                Filter: $stateParams.Filter,
                CategoryID: $stateParams.CategoryID
            }, {inherit: true});
        };

        $scope.getDisplaySchedule = function (schedule) {
            var days = "";
            switch (schedule.listDays.length) {
                case 1:
                    return {type: schedule.listDays[0].day, schedule: $scope.getDisplayWorkTime(schedule)};
                case 2:
                    return {
                        type: schedule.listDays[0].day + " и " + schedule.listDays[1].day,
                        schedule: $scope.getDisplayWorkTime(schedule)
                    };
                case 3: {
                    if (Math.abs(schedule.listDays[0].num - schedule.listDays[1].num) == 1 && Math.abs(schedule.listDays[1].num - schedule.listDays[2].num) == 1)
                        return {
                            type: schedule.listDays[0].day + "-" + schedule.listDays[2].day,
                            schedule: $scope.getDisplayWorkTime(schedule)
                        };
                    else
                        return {
                            type: schedule.listDays[0].day + ", " + schedule.listDays[1].day + ", " + schedule.listDays[2].day,
                            schedule: $scope.getDisplayWorkTime(schedule)
                        };
                }
                default:
                    return {
                        type: 'Основное', schedule: $scope.getDisplayWorkTime(schedule)
                    };
            }
        };

        $scope.getDisplayWorkTime = function (schedule) {
            if (schedule.fromTime.trim() == schedule.toTime.trim())
                return "круглосуточно";
            else
                return schedule.fromTime.substring(0, 5) + "-" + schedule.toTime.substring(0, 5);
        };

        $rootScope.$watch('organizations', function () {
            if ($rootScope.organizations) {
                $rootScope.anchorOrganizations = $rootScope.organizations.filter(o => o.IsAnchor == 1 && o.Schedule != null);
                $rootScope.anchorOrganizations.forEach(i => {
                    try {
                        var schedule = JSON.parse(i.Schedule);

                        var listPeriod = [];
                        schedule.forEach(s => {
                            if (s.isUse != true) {
                                var period = {};
                                period.fromTime = s.From;
                                period.toTime = s.To;
                                period.listDays = [];
                                schedule.forEach(ss => {
                                    if (ss.From == s.From && ss.To == s.To) {
                                        period.listDays.push({num: schedule.indexOf(ss), day: ss.Name});
                                        ss.isUse = true;
                                    }
                                });
                                listPeriod.push(period);
                            }
                        });

                        listPeriod.sort(function (a, b) {
                            return b.listDays.length > 3;
                        });
                        i.displaySchedule = [];
                        listPeriod.forEach(lp => {
                            i.displaySchedule.push($scope.getDisplaySchedule(lp));
                        });
                    }
                    catch (exc) {
                        return;
                    }
                });
                $rootScope.anchorOrganizations = $rootScope.anchorOrganizations.filter(a => a.displaySchedule != undefined);
            }
        });

        $rootScope.filters = {};

        dbVersionService.checkDb();
    };
    controller.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', 'arrayHelper', '$q', 'Idle', '$location', '$stateParams', '$timeout', 'categoryService', 'statisticService', 'dbService', '$linq', '$indexedDB', 'dbVersionService'];
    angular.module('app').controller('mainController', controller);
})();