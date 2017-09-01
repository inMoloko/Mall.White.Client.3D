/**
 * Created by Nekrasov on 20.03.2017.
 */
(function () {
    "use strict";

    class NavigationController {
        constructor($scope, $http, settings, $state, $rootScope, mainMenuService, $stateParams, dbService) {
            // mainMenuService.get().then(function (result) {
            //     $scope.menuItems = result;
            // });
            let self = this;
            self.$state = $state;

            dbService.systemSettingGetMenuItems().then(result => {
                self.menuItems = result;
            });


            this.getClass($state.current.name, $stateParams);

            let locationChangeHandler = $rootScope.$on('$locationChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                self.getClass($state.current.name, $stateParams);
            });

            self.$rootScope = $rootScope;

            $scope.$on('$destroy', function () {
                locationChangeHandler();
            });
        };

        home() {
            if (this.$state.current.name === 'navigation')
                this.$rootScope.$emit('resetMap');
        }

        selectItem(obj) {
            let self = this;

            if (obj === 'shops') {
                var value = self.menuItems['Магазины'];
                self.$state.go('navigation.shops', {CategoryID: value});
                return;
            }
            if (obj === 'restaurants') {
                var value = self.menuItems['Рестораны и кафе'];
                self.$state.go('navigation.restaurants', {CategoryID: value});
                return;
            }
            if (obj === 'entertainments') {
                var value = self.menuItems['Развлечения и услуги'];
                self.$state.go('navigation.searchResult', {CategoryID: value});
                return;
            }
            if (obj === 'proposals') {
                self.$state.go('navigation.proposals');
                return;
            }
        };

        getClass(route, params) {
            let self = this;

            if (!route) {
                self.themClass = 'main';
                return;
            }
            if (route.includes('shop') || route == "navigation.organization") {
                self.themClass = 'shops';
                return;
            }
            if (route.includes('restaurant')) {
                self.themClass = 'food';
                return;
            }
            if (route.includes('proposal')) {
                self.themClass = 'proposals';
                return;
            }
            if (route.includes('entertainment')) {
                self.themClass = 'entertainment';
                return;
            }
            if (route.includes('service')) {
                self.themClass = 'service';
                return;
            }
            if (route.includes('more') || route.includes('event')) {
                self.themClass = 'more';
                return;
            }
            self.themClass = 'main';
            return;

            switch (route) {
                case "navigation":
                    self.themClass = 'main';
                    break;
                case "navigation.shops":
                case "navigation.organization":
                    self.themClass = 'shops';
                    break;
                case "navigation.searchResult":
                    if (params.CategoryID == $scope.menuItems['Магазины']) {
                        self.themClass = 'shops';
                    }
                    if (params.CategoryID == $scope.menuItems['Рестораны и кафе']) {
                        self.themClass = 'food';
                    }
                    break;
                case "navigation.restaurants":
                    self.themClass = 'food';
                    break;
                case "navigation.proposals":
                    self.themClass = 'proposals';
                    break;
                default:
                    self.themClass = 'main';
                    break;

            }
        }
    }

    NavigationController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', 'mainMenuService', '$stateParams', 'dbService'];
    angular.module('app').controller('navigationController', NavigationController);
})();