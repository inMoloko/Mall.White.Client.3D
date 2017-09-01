/**
 * Created by Nekrasov on 07.04.2017.
 */
(function () {
    "use strict";

    class RestaurantHeadingController {
        constructor($scope, $http, settings, $rootScope, $state, $stateParams, $linq, mainMenuService, organizationService) {
            let self = this;
            this.$state = $state;
            self.$rootScope = $rootScope;
            self.organizationService = organizationService;

            mainMenuService.get().then(i => {
                self.menuItems = i;
                self.categoryID = self.menuItems['Рестораны и кафе'];
            });
        }
    };
    RestaurantHeadingController.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$linq', 'mainMenuService', 'organizationService'];
    angular.module('app').controller('restaurantHeadingController', RestaurantHeadingController);
})();