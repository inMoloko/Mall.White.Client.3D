/**
 * Created by Nekrasov on 06.04.2017.
 */
(function () {
    "use strict";

    class ProposalFilterFooterController {

        constructor($scope, $http, settings, $state, $rootScope, $timeout) {
            let self = this;

            self.Result = [];
            if ($state.params.proposalFilter) {

                if ($state.params.proposalFilter.shopFilter && $state.params.proposalFilter.shopFilter.Proposals)
                    self.Result = self.Result.concat($state.params.proposalFilter.shopFilter.Proposals);
                if ($state.params.proposalFilter.restaurantFilter && $state.params.proposalFilter.restaurantFilter.Proposals)
                    self.Result = self.Result.concat($state.params.proposalFilter.restaurantFilter.Proposals);
                if ($state.params.proposalFilter.entertainmentFilter && $state.params.proposalFilter.entertainmentFilter.Proposals)
                    self.Result = self.Result.concat($state.params.proposalFilter.entertainmentFilter.Proposals);
            }
            // self.animation = true;
            // $timeout(i => self.animation = false, 1000);

            //self.Result = $state.params.Proposals;
        }

    }

    ProposalFilterFooterController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope', '$timeout'];
    angular.module('app').controller('proposalFilterFooterController', ProposalFilterFooterController);
})();