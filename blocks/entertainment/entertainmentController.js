/**
 * Created by Nekrasov on 29.03.2017.
 */
(function () {
    "use strict";

    class EntertainmentController {
        constructor($rootScope, $state, dbService) {
            var self = this;
            //self.$rootScope = $rootScope;
            // organizationService.get($state.params.OrganizationID).then(i => {
            //     self.item = i;
            // });
            dbService.organizationGetById($state.params.OrganizationID).then(i => {
                self.item = i;
            });
        };
    }

    EntertainmentController.$inject = ['$rootScope', '$state', 'dbService'];
    angular.module('app').controller('entertainmentController', EntertainmentController);
})();