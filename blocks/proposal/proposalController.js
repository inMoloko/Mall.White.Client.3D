(function () {
    "use strict";

    class ProposalController {
        constructor($scope, $rootScope, $state, $http, settings, $stateParams, proposalService, mainMenuService) {
            var self = this;
            proposalService.get($stateParams.ProposalID).then(i => {
                self.item = i;
            });
            mainMenuService.get().then(function (result) {
                $scope.menuItems = result;

            });
        }

        day() {
            let expressions = ['день', 'дня', 'дней'];
            let result;
            let count = days % 100;
            if (count >= 5 && count <= 20) {
                result = expressions[2];
            } else {
                count = count % 10;
                if (count == 1) {
                    result = expressions[0];
                } else if (count >= 2 && count <= 4) {
                    result = expressions[1];
                } else {
                    result = expressions[2];
                }
            }
            return result;
        }
    }

    ProposalController.$inject = ['$scope', '$rootScope', '$state', '$http', 'settings', '$stateParams', 'proposalService', 'mainMenuService'];
    angular.module('app').controller('proposalController', ProposalController);
})();