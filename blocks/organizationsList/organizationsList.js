(function () {
    "use strict";

    class OrganizationsListController {
        constructor($scope, $http, settings, $rootScope, $state, $stateParams, $linq, organizationService, mainMenuService, dbService) {
            let self = this;
            self.$state = $state;
            self.dbService = dbService;


            this.$rootScope = $rootScope;

            self.executeFilter();
            // mainMenuService.get().then(i => {
            //     $scope.menuItems = i;
            // });
            dbService.systemSettingGetMenuItems().then(i => {
                $scope.menuItems = i;
            });
            // $scope.home = function () {
            //     $state.go('navigation.mainMenu');
            // };
            //
            // $scope.hide = function () {
            //     $rootScope.currentStateName = $state.current.name;
            //     $rootScope.currentStateParam = $state.params;
            //     $rootScope.closeResultTitle = 'Найдено ' + $scope.currentOrganizations.length;
            //     $state.go("navigation.closedResult", {
            //         CategoryID: $stateParams.CategoryID,
            //         Filter: $stateParams.Filter,
            //         OrganizationType: $stateParams.OrganizationType
            //     });
            // };
            let stateChangeHandler = $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    if (toState.name === 'navigation.searchResult' && fromState.name === 'navigation.searchResult.organization') {
                        $rootScope.currentOrganization = undefined;
                        self.executeFilter();
                    }
                });
            $scope.$on("$destroy", function () {
                stateChangeHandler();
                locationChangeHandler();
            });
            let locationChangeHandler = $scope.$on('$locationChangeSuccess', function () {
                self.executeFilter();
            });
            // $scope.getFloors = function (item) {
            //     if (!item)
            //         return;
            //     //return $linq.Enumerable().From(item.OrganizationMapObject).Select(i => $rootScope.floorsDic[i.MapObject.FloorID].Number).Distinct().ToArray().join(',');
            //     return item.Floors.map(i => i.Number).join(',');
            // };
        }

        executeFilter() {
            let self = this;
            self.searchText = self.$state.params.Filter;
            self.dbService.organizationGetFilter(self.$state.params.Filter, self.$state.params.CategoryID).then(i => {
                self.currentOrganizations = i;
                self.$state.go(self.$state.current.name, {Organizations: i, CategoryID: self.$state.params.CategoryID});
            });
        }

        select(item) {
            let self = this;
            self.dbService.getData().then(data => {
                let type = self.dbService.getOrganizationTypeSync(data, item);
                self.$state.go("." + type, {
                    OrganizationID: item.OrganizationID,
                    CategoryID: self.dbService.categoryGetByTypeSync(data, type).CategoryID
                });
            });
            return;
        };
    }

    OrganizationsListController.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$linq', 'organizationService', 'mainMenuService', 'dbService'];
    angular.module('app').controller('organizationsListController', OrganizationsListController);
})();