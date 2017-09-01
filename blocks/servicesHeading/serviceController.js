/**
 * Created by Nekrasov on 30.03.2017.
 */
(function () {
    "use strict";
    var controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, organizationService, $linq, mainMenuService) {
        var self = this;
        self.$rootScope = $rootScope;

        organizationService.get($state.params.OrganizationID).then(i => {
            self.item = i;
        });
    };

    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', 'organizationService', '$linq', 'mainMenuService'];
    angular.module('app').controller('serviceController', controller);
})();