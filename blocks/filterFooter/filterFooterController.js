/**
 * Created by Nekrasov on 05.04.2017.
 */
(function () {
    "use strict";

    class FilterFooterController {

        constructor($scope, $http, settings, $state, $rootScope, $timeout) {
            let self = this;
            self.Result = $state.params.Organizations;
            // self.animation = true;
            // $timeout(i => {
            //     self.animation = false;
            // }, 500);
        }

    }

    FilterFooterController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', '$timeout'];
    angular.module('app').controller('filterFooterController', FilterFooterController);
})();