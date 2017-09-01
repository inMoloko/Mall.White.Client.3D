/**
 * Created by Nekrasov on 06.04.2017.
 */
(function () {
    "use strict";

    class FilterHeadingController {

        constructor($scope, $http, settings, $state, $rootScope) {
            let self = this;

            self.$state = $state;

            if ($state.current.name.includes('shop')) {
                self.filterName = 'shopFilter';
                self.list = 'navigation.shops';
            } else if ($state.current.name.includes('restaurant')) {
                self.filterName = 'restaurantFilter';
                self.list = 'navigation.restaurants';
            } else if ($state.current.name.includes('entertainment')) {
                self.filterName = 'entertainmentFilter';
                self.list = 'navigation.entertainments';
            } else if ($state.current.name.includes('proposal')) {
                self.filterName = 'proposalFilter';
            }

        }

        clean() {
            let self = this;
            self.$state.go('.', {[self.filterName]: null, Organizations: []});
        }
    }

    FilterHeadingController.$inject = ['$scope', '$http', 'settings', '$state', '$rootScope'];
    angular.module('app').controller('filterHeadingController', FilterHeadingController);
})();