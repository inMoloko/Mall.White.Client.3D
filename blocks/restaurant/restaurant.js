/**
 * Created by Nekrasov on 29.03.2017.
 */
(function () {
    "use strict";
    var controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, organizationService, $linq, mainMenuService, dbService) {
        var self = this;
        self.$rootScope = $rootScope;

        // organizationService.get($state.params.OrganizationID).then(i => {
        //     self.item = i;
        // });
        dbService.organizationGetById($state.params.OrganizationID).then(i => {
            self.item = i;
        });
    };

    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', 'organizationService', '$linq', 'mainMenuService', 'dbService'];
    angular.module('app').controller('restaurantController', controller);
})();