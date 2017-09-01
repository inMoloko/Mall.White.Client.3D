(function () {
    "use strict";
    var controller = function ($scope, proposalService, settings, $state, $rootScope) {
        this.settings = settings;

        if ($state.params.OrganizationID) {
            proposalService.getByOrganization($state.params.OrganizationID).then(function (data) {
                $scope.items = data;

                $scope.searchText = $state.params.Filter;
            });
        }
        else
            proposalService.getFilter($state.params.Filter || '').then(function (data) {
                $scope.items = data;

                $scope.searchText = $state.params.Filter;
            });
    };
    controller.prototype.getUrl = function (id) {
        return this.settings.webApiBaseUrl + '/Proposal/' + id + '/WideLogo';
    };
    controller.$inject = ['$scope', 'proposalService', 'settings', '$state', '$rootScope'];
    angular.module('app').controller('proposalListController', controller);
})();