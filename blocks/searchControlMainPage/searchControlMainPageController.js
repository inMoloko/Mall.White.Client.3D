/**
 * Created by Nekrasov on 17.03.2017.
 */
(function () {
    "use strict";
    let controller = function ($scope, $http, settings, $rootScope, $state, $stateParams, $timeout) {
        let self = this;
        self._$state = $state;
    };
    controller.prototype.goSearch = function () {
        let self = this;
        self._$state.go('navigation.favoriteSearch');
    };
    controller.$inject = ['$scope', '$http', 'settings', '$rootScope', '$state', '$stateParams', '$timeout'];
    angular.module('app').controller('searchControlMainPageController', controller);
})();