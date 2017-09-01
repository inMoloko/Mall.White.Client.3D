/**
 * Created by Nekrasov on 06.04.2017.
 */
(function () {
    "use strict";

    class ProposalFilterListController {
        constructor($scope, $http, settings, $state, $rootScope) {
            let self = this;

            self.$state = $state;

            $scope.items = [];
            if ($state.params.proposalFilter) {

                if ($state.params.proposalFilter.shopFilter && $state.params.proposalFilter.shopFilter.Proposals)
                    $scope.items = $scope.items.concat($state.params.proposalFilter.shopFilter.Proposals);
                if ($state.params.proposalFilter.restaurantFilter && $state.params.proposalFilter.restaurantFilter.Proposals)
                    $scope.items = $scope.items.concat($state.params.proposalFilter.restaurantFilter.Proposals);
                if ($state.params.proposalFilter.entertainmentFilter && $state.params.proposalFilter.entertainmentFilter.Proposals)
                    $scope.items = $scope.items.concat($state.params.proposalFilter.entertainmentFilter.Proposals);
            }


            //$scope.items = $state.params.Proposals;

            $scope.select = function (item) {
                $state.go(".organization", {OrganizationID: item.OrganizationID});
            };

            if ($state.params.proposalFilter) {
                let filterName = $state.params.proposalFilter.filterName;

                if (!$state.params.proposalFilter[filterName]) {
                    self.filter = '';
                } else {
                    let tmp = [];
                    let categories = $state.params.proposalFilter[filterName].Categories.filter(i => i.select == true);
                    if (categories.length != 0) {
                        tmp = categories.map(i => i.Name);
                    }

                    if ($state.params.proposalFilter[filterName].HasProposals) {
                        tmp.unshift('Акции');
                    }
                    self.filter = tmp.join('/');
                }
            }
        }

        clean() {
            let self = this;
            self.$state.go("navigation.proposals", {proposalFilter: null});
        }
    }

    ProposalFilterListController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope'];
    angular.module('app').controller('proposalFilterListController', ProposalFilterListController);
})();